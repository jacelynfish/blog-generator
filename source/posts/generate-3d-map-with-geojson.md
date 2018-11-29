---
title: Three.js空间地理可视化：3D行政区域图开发
date: 2018-10-14 03:37:59
tags:
  - data visualization
  - mapbox
categories:
  - JavaScript
---

好久没填坑了呀……从毕设到校招培训，感觉这半年一直横冲直撞没啥沉淀，只要项目来需求撸起袖子就肝【。这个月一直在学可视化开发，Three.js 和 Echarts、D3 都略有接触了，今天就讲讲空间地理可视化的一些经验吧~ 💃🏻💃🏻💃🏻

> 位置数据的最大好处就在于它与现实世界的联系。 —— N. Yau《数据之美》

在数据可视化的过程中，使用地理坐标系来映射具体位置数据能增强数据背后的环境信息和关联信息，使读者能快速总览某一区域的情况，同时也能聚焦在她/他最关心的某一范围。而在可视化数据大屏的实践里，空间可视化因其宏观、酷炫的效果而常常作为大屏底图，如在 3D 地球或 2D 地图瓦片的基础上，加上热力图、飞线等效果，以更好地展示跨地理区域的数据。本文将会介绍如何通过使用 [Three.js](https://threejs.org/) 和 [d3-geo](https://github.com/d3/d3-geo) 将 Geojson 这种地理数据文件来渲染 WebGL 3D 行政区域图。

<!-- more -->

## 基本思路

本文会着重介绍通过 Geojson 绘制 WebGL 的 3D 行政区域图，关于 Three.js 的场景搭建、raycasting 等会略过~主要有一下几个步骤：

1. 通过 Geojson 生成 SVG 路径，也就是用在 SVG `<path>` 标签里的 `d` 属性值；
2. 将 SVG 路径生成 Three.js [`ShapePath`](https://threejs.org/docs/index.html#api/en/extras/core/ShapePath) 对象，用于创建 [`ExtrudeGeometry`](https://threejs.org/docs/index.html#api/en/geometries/ExtrudeGeometry) 通过拉伸 2D 平面形状到有高度的 3D 立体图形；
3. 作 SVG 坐标系统到 Three.js  中右手坐标系的  矩阵变换。

进入正文之前，先看一下  完整代码和渲染效果八~

{% codepen jacelynfish JmygbR light js,result 400 %}

## 使用 Geojson 生成 SVG 路径

> 地理信息可可视化的最基本步骤是地图投影，即将数据中的地理坐标转换到二维的屏幕坐标。讲一个不可展平曲面上位置映射到二维平面，等价于曲面参数化。—— 陈为《数据可视化》

 在获得 Geojson 数据后，我们首先需要将经纬度数据一一映射到屏幕坐标系上。d3-geo 不仅提供了包括 Mercator、Albers 等坐标转换方法，更提供了投影时常用的位移、自定义面积适应等方法，在这里我们选择使用墨卡托投影（Mercator Projection）。

墨卡托投影又称正轴等角圆柱投影，有投影等角度的特点，即投影面上任何点上两个微分线段组成的角度投影前后保持不变。该方法用一个与地轴方向一致的圆柱切割地球，并按等角度条件，将地球的经纬网投影到圆柱面上。将圆柱面展平后，获得墨卡托投影后的地图。相邻纬线之间的距离由赤道向两级增加，在赤道上的对象保持原始的面积，越远离赤道面积变形越大。

![mercator_projection](/images/generate-3d-map-with-geojson/mercator2.gif)

由于我们选取广东的纬度较接近赤道，因此投影出来的面积形状形变不会特别  明显， 比较接近实际情况。

```javascript
let mercator = d3
  .geoMercator()
  .rotate([-150, 0, 0])
  .fitSize([fitExtent, fitExtent], geojson)
  .precision(0.6);
let projection = d3.geoPath(mercator);
```

使用 `d3.geoMercator()` 方法我们创建了墨卡托投影。`rotate([angles])` 方法  让我们在投影前  对起始经纬度做一个旋转，如我们就在变换前经度上旋转了 150°，使中国大致处于当前地图中心。`fitSize(size, object)` 对投影后的平面地图进行缩放和位移，将传入的 Geojson `object` 的投影面积自动按原比例缩放为 `size[0] * size[1]`。如果不使用自定义的缩放相关方法，d3 会使用默认 scale，而每个投影方法的默认 scale 都不尽一样。默认 scale 将你的目标地理范围放在全球面积的角度来投影，导致投影出来只有一个小点（如下图）= =。除了 `fitSize()` 或 `fitExtent()`，你还可以使用 `transform.center().scale().translate()` 等一系列方法自定缩放、位移的效果，具体用法可以查看 [d3-geo 相关文档](https://github.com/d3/d3-geo)。
![fit_comapration](/images/generate-3d-map-with-geojson/fit_comparation.png)

获得投影方法后，就可以正式将 Geojson 的特征数据集转换为 SVG 路径了并同时生成 Three.js 的 `ShapePath` 对象，用于之后拉伸为立体图形。在这个过程中我们将会使用到《ThreeJS 开发指南》的作者开发的 [d3threeD](https://github.com/asutherland/d3-threeD) 这个小工具，主要是对 SVG 路径字符串解码，将常用 path 命令转换为 Three.js 中相应的路径操作函数。

但这个  库年久失修（……），没办法处理用科学计数法表示的一些小数和命令（如小写字母 a），也只支持 `Shape` 对象（`ShapePath` 区分洞孔，可以更自由地转化为 `Shape`），因此参考[官方示例](https://threejs.org/examples/?q=shape#webgl_geometry_extrude_shapes2)我对这个库做了一些[个人修改](https://jacelyn.fish/lib/modules/d3threeD.js)。

```javascript
// https://jacelyn.fish/lib/modules/d3threeD.js

// 检测由科学计数法表示的小数，一般路径中如果出现这种数字都是及其接近0，误差可以忽略，直接替换为0.0
const pathPattern = /\-?\d+(\.\d+)?e\-?\d+/g;
function d3threeD(exports) {
    // ...
    exports.transformSVGPath = function transformSVGPath(_pathStr) {
        let pathStr = _pathStr.replace(pathPattern, '0.0')
        var path = new THREE.ShapePath(); // 使用 ShapePath
        var idx = 1,
        len = pathStr.length,
        //...
    }
}
```

在 `drawGeoSVG` 方法中，使用 Geojson 生成 `shapes` 数组，每项都包括本身的经纬度数据、中心点相对当前 `Shape` 的距离（以便后续打点）和 `Shape` 对象本身。

```javascript
let _d3threeD = {};
d3threeD(_d3threeD);
transformSVGPath = _d3threeD.transformSVGPath;

// drawGeoSVG() line 49 - 78
let shapes = [];
geojson.features.forEach(feature => {
  let path = projection(feature);
  if (path) {
    // 这里必要检测 path 是否为 undefined，因为之前使用了自定义缩放，在给定的 fitExtent 距离外的 feature 会生成 undefined
    try {
      let _path = transformSVGPath(path); // 生成 ShapePath
      let _shapes = _path.toShapes(false, false); // 用 .toShapes 方法将 ShapePath 转换为 Shape
      shapes.push({
        data: Object.assign(feature.properties, {
          centroid: projection.centroid(feature) // 当前 feature 的中心点相对距离x,y，单位像素
        }),
        _shapes
      });
    } catch (e) {
      console.log(e);
    }
  }
});
```

`drawGeoSVG` 返回的 `shapes` 数组就是之后拉伸立体图形和  采样描绘轮廓的基础啦~

## 轮廓描边和 3D 拉伸深  度

### 轮廓描边

绘制轮廓的  逻辑其实很直白，就是在 `Shape` 路径中采样并将点集生成 `THREE.Line` 对象即可。生成的轮廓不用马上添加到场景里，而是添加到之后生成的、各自所属的  立体图形  中。

```javascript
function drawOutlines(shapes) {
  // line 130- 156
  let outlines = [];
  shapes.forEach(item => {
    let lines = new THREE.Group(); // 一个行政区可能会有多个闭合形状
    lines.userData.name = 'Administrative Lines';
    item._shapes.forEach(shape => {
      let pts = shape.getPoints();
      let line = new THREE.Line(
        new THREE.Geometry(),
        new THREE.LineBasicMaterial({
          color: highLightColor
        })
      );
      pts.forEach(pt => {
        line.geometry.vertices.push(new THREE.Vector3(pt.x, pt.y, 0));
        line.geometry.colors.push(highLightColor);
      });
      lines.add(line);
    });
    outlines.push(lines);
  });
  return outlines;
}
```

### 立体拉伸

`THREE.ExtrudeGeometry()` 接收 `Shape` 或者 `Shape` 数组，通过增加深度的方式拉伸平面图形为立体几何。乍看上去十分方便，直接传入 `{ depth: 50 }` 这样的配置就可得到自己想要的高度。但是仔细一想，这样直接生成的几何体顶点 vertices 的值都是固定的，如果需要实现，如示例般交互动态改变拉伸长度，就需要手动管理 `geometry.vertices` 这些成千上万个顶点的位置，如果结合材质，还要更新计算 UV mapping（😨 听起来就很累人……

这时候就可以转换一下思维啦：想要改变物体的形状，除了计算集合本身的顶点位置，还有什么其他方法呢？参考官方示例里的大量动画效果，如 autoRotate 等，都是在每一轮渲染循环里直接改变 Mesh 的 `rotation` 属性！以此类推，动态改变长度是不是可以直接  修改某一轴 `scale` 属性呢嘻嘻嘻 👻

因此，我们可以在创建一个深度为 1 的拉伸几何体并创建网格对象后，通过修改该 `Mesh` 的 `scale.z` 值实现动态拉伸的效果~

```javascript
let group = new THREE.Group(); // 将所有子行政区集合到一个 Group 中以便后续统一矩阵变换

// drawProvince(shapes, outlines) line 80 - 128
shapes.forEach((item, i) => {
  let geometry = new THREE.Geometry();
  item._shapes.forEach(shape => {
    // 创建一个深度为 1 的拉伸几何体
    let extrude = new THREE.ExtrudeGeometry(
      shape,
      Object.assign({ depth: 1 }, extrudeOpts)
    );
    // 一个相同的行政区域可能会在形状上分割成很多闭合的部分，
    // 用 geometry.merge()方法聚合同一个行政区的几何形状
    geometry.merge(extrude);
  });
  let mesh = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial({}));
  mesh.add(outlines[i]); // 将之前绘制的行政区域轮廓添加为网格的子元素

  let scaleZ = minExtrude; // 初始拉伸长度
  mesh.scale.set(1, 1, scaleZ); // 拉伸Z轴实现立体效果
  mesh.position.z = -scaleZ; // 同时也往Z轴负方向位移相应距离
  outlines[i].position.z = -1 / scaleZ; // 解决轮廓闪烁问题
  mesh.userData = item.data;
  group.add(mesh);
});
```

注意在 16 行里我们将之前绘制的行政区域轮廓添加为相应网格的子元素，这能使轮廓和网格成为一个整体，**随后的拉伸和位移会应用到这个整体上**。另外，由于上一小节中的轮廓因为开启了 depthBuffer 检测，如果轮廓和网格表面在 z 轴同一位置上会出现闪烁的 bug，需要将轮廓位移到网格的 1px 外。因现在  轮廓所在的本地坐标 Z 轴已经被扩大了了 `scaleZ` 倍，因此需要手动缩小响应倍数。

此时，只要改变相应网格的 `scale.z` 就可以动态改变几何体的高度啦~在这个例子里我们使用的是 raycasting，鼠标移过的区域会动态随机高度和改变材质颜色，并在中心位置出现地名标签。通过 Tween.js 为高度过渡实现了动画，让交互过程更自然~

```javascript
function changeGroupHeight(mesh, height) {
  let scaleZ = { z: mesh.scale.z };
  let isComplete = false;

  let tween = new TWEEN.Tween(scaleZ)
    .to({ z: height }, 800)
    .easing(TWEEN.Easing.Quartic.Out)
    .onUpdate(() => {
      // 通过改变z轴拉伸范围来修改几何体的高度
      mesh.scale.set(1, 1, scaleZ.z);
      mesh.position.z = -scaleZ.z;
      mesh.children[0].position.z = -1 / scaleZ.z;
    })
    .onComplete(() => {
      isComplete = true;
    });
  let update = () => {
    TWEEN.update();
    !isComplete && requestAnimationFrame(update);
  };
  tween.start();
  update();
}
```

![upside_down](/images/generate-3d-map-with-geojson/upside_down.png)

看起来效果还不错呢~只是……还有一个*小*问题：为啥整个图是反过来的啊啊啊？？？🙄

### 坐标转换

到目前为止，绘制出来的行政图 Y 轴方向相反的原因其实是 WebGL 和 SVG 坐标系统未做转换的问题。如图所示，在 WebGL 中的世界坐标系使用的是右手坐标系（Right Handed Coordinate System）Y 轴正方向指向**上**；而 SVG 使用的坐标系统跟 Canvas 类似的视口坐标系，视口左上角为原点(0, 0)，Y 轴正方向为**下**。
![coordinate_system](/images/generate-3d-map-with-geojson/coordinate_system.png)在这个映射的过程中，若是直接将 d3threeD 生成的 `Shape` 直接放置入场景中，必定会出现纵坐标相反的问题。
![coordinate_transform](/images/generate-3d-map-with-geojson/coordinate_transform.png) 这时便需要对整个 3D 图形 `group` 实现坐标变换。在这个过程中我们直接使用矩阵同时实现 Y 轴和 Z 轴的翻转和中心点位移。关于矩阵转换可以参考[这篇教程](https://webglfundamentals.org/webgl/lessons/webgl-3d-orthographic.html)。

```javascript
function getPosMat(x, y, z) {
  let posMat = new THREE.Matrix4();
  // rotateZ(Math.PI)
  // rotateY(Math.PI)
  posMat.set(1, 0, 0, x, 0, -1, 0, y, 0, 0, -1, z, 0, 0, 0, 1);
  return posMat;
}
function drawProvince(shapes, outlines) {
  // x 和 y 分别位移 fitExtent / 2 的位置至原点
  let posMat = getPosMat(-fitExtent / 2, fitExtent / 2, 0);

  // ... 上述的绘制立体图形逻辑

  group.applyMatrix(posMat); // 整个立体图形整体翻转和位移
  scene.add(group);
}
```

这样就能得到一个位于 WebGL 坐标轴原点的立体地理图形啦~🤓

## 中心标签打点

很多第三方库在实现文字打点的时会直接在 WebGL 中渲染文字，但这种方案生成的文字标签也是一个 3D 元素，如果不进行特殊大小处理，会随镜头的拉伸有很明显的缩放；同时渲染文字在也对 Three.js 应用有很高的性能要求。因此在这个例子里，我们创建 DOM 节点来生成动态标签，用 CSS 控制它的动画和位置。

```javascript
let label = document.getElementById('map-label');
function getPoint2ScreenCoord(target) {
  let mat = new THREE.Matrix4();
  let wHeight = window.innerHeight;
  let wWidth = window.innerWidth;
  // WebGL 视口坐标系转换为屏幕坐标系的矩阵
  mat.set(
    wWidth / 2,
    0,
    0,
    wWidth / 2,
    0,
    -wHeight / 2,
    0,
    wHeight / 2,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1
  );

  // 中心点相对目标3D形状坐标 -> 世界坐标 -> 屏幕坐标
  let centroid = target.userData.centroid;
  let pos = target.localToWorld(new THREE.Vector3(centroid[0], centroid[1], 0));
  let { x, y } = pos.project(camera).applyMatrix4(mat);

  label.style.left = x + 'px';
  label.style.top = y + 'px';
  label.style.opacity = 1;
  label.textContent = selectedObject.userData.name;
}
```

![centroid](/images/generate-3d-map-with-geojson/centroid.png)之前储存在 `userData` 里的 `centroid` 数组在打点时就派上用场啦。如图，它的数值是 `[相对x, 相对y]`，将相对坐标转换为世界坐标后再映射到屏幕坐标，将 x 和 y 分别赋予绝对定位 DOM 元素的 `left` 和 `top` 样式即可。

到这里，我们就通过 Geojson 数据，一步一步生成了一个可交互的 Three.js 立体地理区域图~撒花~~~٩(˃̶͈̀௰˂̶͈́)و

## 最后的一点碎碎念

虽然说现在市面上 Echarts 或者其他可视化组件库都能通过配置直接生成这种行政区域图，然而大屏本质上作为展示数据的*静态*页面（弱交互、定制化高），为了生成某一个省市而引入庞大的第三方库貌似在打包体积和性能上得不偿失啊……再者，高度定制化的特点使得第三方库的配置项未必能满足所有设计原型，因此才有这个从最基础 geojson 数据搭建组件的想法。

 借这篇 po 来记录造轮子的的思考过程之余，其实也收获了不少可视化开发的通用技巧，如

- 使用 d3threeD 将通用 SVG 路径转换为 Three.js `ShapePath / Shape` 后，可进一步生成其他网格
-  矩阵变换的使用，包括普通形变和从 Three.js 场景坐标轴到屏幕坐标轴的映射

按你胃，造这个轮子的过程真的踩了很多坑，包括上面提到的纵轴相反的转换和动态拉伸长度。往往这些瓶颈只要逆向思考一下就能找到非常规的实现方法，真的锻炼个人解决问题的思维，推着自己 think out of the box，也是蛮受益匪浅的，因为这个 3D 地图和之前项目里开发的 3D 地球，打开了 GIS 新世界的大门，了解了很多地理信息学的概念和算法，也夯实了 WebGL 基础（其实更多是 Three.js 的 API 啦哈哈哈哈），大概下一篇就会介绍扒瓦片的血泪之路吧【。
