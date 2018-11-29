---
title: Mapbox 离线资源本地化实践
date: 2018-10-19 16:25:23
tags:
  - data visualization
  - GIS
  - mapbox
categories:
  - JavaScript
---

在空间数据可视化领域里，开源产品 [Mapbox GL](https://www.mapbox.com/mapbox-gl-js/api/#map) 无疑是搭建 3D 地理场景的最佳选择了。相比于传统的栅格瓦片资源，Mapbox 支持使用矢量地图切片渲染可交互的、**可按图层配置样式**的动态地图，并且使用 Protocol Buffer 编码的瓦片数据体积比图片资源更小，更一步节省地图消耗的流量。[OpenStreetMap](https://www.openstreetmap.org/)（下文简称 OSM）为 Mapbox 在线 API 提供了自然/人文地理数据，它是一个由全球各地的地理爱好者共同参与贡献数据的开源项目，而 Mapbox 也是其最大的贡献者之一。

想要使用 Mapbox GL，最直白的方法便是在引用了相应的 JS/CSS 文件后，使用官方提供的开发者 `accessToken` 去获取地图瓦片及其他资源，如[官网示例](https://www.mapbox.com/mapbox-gl-js/example/simple-map/)：

```html
<script>
  mapboxgl.accessToken = '<your access token here>'; // 访问默认瓦片资源
  var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/streets-v9', // stylesheet location
    center: [-74.5, 40], // starting position [lng, lat]
    zoom: 9 // starting zoom
  });
</script>
```

然而由于某些不可描述的原因，我们无法直接通过 Mapbox GL JS API 访问国外地图瓦片资源，即使挂了代理，瓦片资源加载也非常慢；再者，在 toB 的业务场景里，由于企业数据的保密等要求，首要条件就是产品需部署在独立内网里，这意味着我们不能为了一个酷炫的大屏效果而去访问互联网数据，而是将所需地图资源实现本地储存、访问。在这篇文章我们将会介绍如何获取 OSM 数据，并通过 [Mapbox 官方开源工具](https://github.com/mapbox)生成、在 Nginx 上部署本地矢量瓦片资源。

<!-- more -->

## 获取 OSM 数据

有以下几个途径可以快速获得 OSM 数据

- [**OpenStreetMap 官方网站**](https://www.openstreetmap.org): 直接下载 `.osm` 数据
- [**Hotosm Export Tool**](https://export.hotosm.org/en/v3/): 按数据类型（路网、水域、建筑）分类导出数据，支持 `.shp`, `.geojson`, `.mbtiles` 等数据格式。不过需要注意的是 hotosm 上导出的 `mbtiles` 是彩色栅格图片，无法直接通过 Mapbox 配置样式
- [**bbbike**](https://extract.bbbike.org/): bbbike 导出的 OSM 数据具有较完整的属性数据，一次导出最大支持 24,000,000 平方公里或 512 MB 的数据。
- [**OpenStreetMapData**](http://openstreetmapdata.com/data/water-polygons): 根据 OSM 数据里的 `natural=coastline` 生成的海洋和陆地的 polygon，并做了切分便于数据提取。

## Geo 数据处理、提取

在分析、处理 GIS 相关数据时，常需要查看相关属性并对数据进行编辑和选择性导出。在这篇文章中我们使用开源 GIS 编辑器 [QGIS](https://qgis.org/en/site/) 来对数据进行预处理：

### 人文数据处理

由于 [bbbike](https://extract.bbbike.org/) 这里导出的额外属性（路名、道路类型等）比较全，我们这篇文章主要采用 bbbike 导出的数据渲染道路网、路名和内地水域；我们可以把所有数据导出为一份 `.geojson` 文件，通过 Mapbox GL 中 `source-layer` 配置项指定图层名，以图层为单位渲染不同类型的地理信息；或不同类型各自导出独立 `.geojson` 文件并使用 [tippecanoe](https://github.com/mapbox/tippecanoe) 合并瓦片，具体操作会在下文介绍 🌚

### 海岸线处理

当需求场景所在的地理位置是在沿海城市时，我们便需要区分陆地和海洋，而 OSM 的数据里只用 `natural=coastline` 标记海岸线，没有具体区分 land/ocean，因此采用 [OpenStreetMapData](http://openstreetmapdata.com/data/water-polygons) 这里的数据渲染海岸线图案。因为陆地和海洋的形状是互补的，为了展示海岸线我们不必同时生成两者在同一经纬度范围的瓦片，而是生成其中一种地形，并用颜色或其他视觉效果形成对比。这里就有一个权衡的过程了：当展示的内容面积主要在陆地上时，生成部分海洋瓦片用于视觉展示；相反的情况下，生成陆地瓦片，能有效减少静态瓦片资源大小。

因为我们主要展示陆地路网，所以选择生成部分海边水域的瓦片。然而即使沿海岸线的水域已经切分成小区域，每一块多边形依然覆盖了远超我们需要展示的面积，借助一些小技巧便可自由框取我们实际需要的瓦片范围：

1.  在 [geojson.io](https://geojson.io) 框出期望展示的经纬度范围，形成一个多边形的 geojson 文件并导入 QGIS 中，放置于待处理图层上；![clip1](/images/mapbox-localization/clip1.png)
2.  点击 QGIS 工具栏 -> Vector -> Geoprocessing Tools -> Clip, ![clip2](/images/mapbox-localization/clip2.png) `Input Layer` 选择刚刚导入的 geojson helper 层， `Clip Layer` 选择从中抠取的待处理图层，并填写好结果图层名称后选择 `Run in Background` 即可生成选择图形。只有 `Input Layer` 和 `Clip Layer` 相交的范围会被选中。数据中 Features 的值并不会变化，变化的只是导出图层的面积和长宽等属性。如果这些值在被切割前当做属性储存在 GIS 数据里，这些值也需要手动更新；![clip3](/images/mapbox-localization/clip3.png) ![clip4](/images/mapbox-localization/clip4.png)
3.  在 attribute table 中选取需要的字段，并导出当前图层用于后续生成瓦片就得到期望范围的 geojson 形状啦 ʕ •ᴥ•ʔ

### 其他

除了 QGIS，还可使用这些工具查看、编辑和转换其他格式的 GIS 文件：

- [**Mapshaper**](https://mapshaper.org/)：可用于在线 ShapeFile 查看、转换为 `.geojson`
- [**ogr2ogr**](https://www.gdal.org/ogr2ogr.html)：转换 ShapeFile、MapInfo、PostgreSQL 等格式的 GIS 数据，并支持属性选择和坐标系统转换等功能
- [**ArcGIS**]()

## 搭建矢量瓦片服务

GIS 数据生成矢量瓦片的具体流程主要有这几步：

1. 使用 Mapbox 开源瓦片数据处理工具 [tippecanoe](https://github.com/mapbox/tippecanoe) 转换 json 数据为 `.mbtiles` 格式。在这个过程中可进行独立图层合并、设置缩放范围和过滤属性等操作；
   ```Shell
   tippecanoe -o geodata.mbtiles -z 18 -Z 13 -f -n geodata ~/road.geojson ~/water.geojson ~/sea.geojson;
   ```
   [MBTiles](https://www.mapbox.com/help/define-mbtiles/) 是一个由 Mapbox 制定的、基于 SQLite 的开源规范，通过视图减少冗余瓦片在文件系统中的体积，用于高效储存矢量或栅格瓦片数据。tippecanoe 生成的 MBTiles 会合并所有输入文件为多个图层，源文件名便是图层名；也可以使用 `-l name` 来指定图层名，但这个指令会合并所有源数据为一个图层。更多选项请参考[官方仓库](https://github.com/mapbox/tippecanoe)；
2. 由于 `.mbtiles` 文件**本身不是瓦片**，而是储存瓦片的数据库文件，需要使用 [mb-util]() 将矢量瓦片数据导出为可直接作为静态文件请求的 `.pbf` 格式；
   ```Shell
   mb-util --image_format=pbf geodata.mbtiles ~/tiles/geodata/map/;
   ```
   导出的瓦片会以 z（缩放级别）/ x（瓦片列数）/ y（瓦片行数） 形式储存在磁盘上，在随后的 Mapbox 配置中也会以这个顺序索引矢量文件；
3. 因为 mb-util 导出的瓦片经过 gzip 压缩，无法被 Mapbox GL 直接解析，因此我们需要解压该 `.pbf` 文件；
   ```Shell
   cd ~/tiles/geodata/map/;
   gzip -d -r -S .pbf *;
   find . -type f -exec mv '{}' '{}'.pbf \; // optional
   ```
4. 搭建 nginx 静态文件服务器。另外需要注意的一点是，当我们生成的切片是在一定区域而不是全球范围内时，当 Mapbox 请求了生成切片范围外的瓦片时会大量报错 404，虽然 Mapbox 已经在 [release v0.48.0](https://github.com/mapbox/mapbox-gl-js/releases/tag/v0.48.0) 上将响应为 404 或 200 的资源视为*可渲染的空切片（empty renderable tiles）*来[防止过渡渲染](https://github.com/mapbox/mapbox-gl-js/issues/6768)， `Content-length` 为 0 的瓦片资源并不影响整体效果，然而由浏览器抛出的的 404 请求错误却堆积如山。我们可以通过配置 Nginx 将多余的 404 瓦片请求返回状态码 204（`no-content`）来抑制浏览器本身的报错：

   ```
   location ~* /geodata/.*(\.pbf)${
       log_not_found off;
       gzip off;                                   # 不压缩瓦片资源
       if( !-f $request_filename) { return 204 }   # 当 pbf 文件不存在时返回204
   }
   ```

另外，在 Mapbox 渲染过程中，除了矢量瓦片数据，还需要相应的样式文件、字体（glyphs）和精灵图片（sprite）。如果想完全离线搭建 Mapbox GL 应用而不是通过 accessToken 访问 Mapbox 服务器，则需要在本地或内网里提供这些可访问资源：

- [genfontgl](https://github.com/sabas/genfontgl)：转换 `.ttf` 字体文件为 `.pbf` 资源
- [spritezero-cli](https://github.com/mapbox/spritezero-cli) & [spritezero](https://github.com/mapbox/spritezero)：生成 Mapbox GL 可用的小图标资源

## Mapbox 配置实践

在搭建好 Nginx 静态资源服务后，我们便可以在前端 Mapbox 配置中引用刚生成的瓦片切片文件了~在 `style` 中配置 `sources` 以矢量形式引用瓦片，以便后续更改样式。

```javascript
const map = new mapboxgl.Map({
  style: {
    glyphs: `${location.origin}/geodata/font/{fontstack}/{range}.pbf`,
    version: 8,
    sources: {
      composite: {
        type: 'vector',
        tiles: [`${location.origin}/geodata/map/{z}/{x}/{y}.pbf`],
        tileSize: 512
      }
    },
    layers: [
      /* 独立图层样式配置 */
    ]
  }
});
```

在 `layers` 中我们可以为不同类型的数据独立配置样式，Mapbox 按**图层顺序**绘制。以路网作为一个图层的例子，我们指定数据来源是 `composite`，并将图层名 `source-layer` 指向了 `road`，并通过 [Filter Expression](https://www.mapbox.com/mapbox-gl-js/style-spec/#expressions) 筛选出非路干（primary/secondary）的形状进行样式调整：

```javascript
{
    "id": "road-general",
    "type": "line",
    "source": "composite",
    "source-layer": "road",
    "filter": [
        "!in",
        "type",
        "primary",
        "secondary",
    ],
    "layout": {
        "line-cap": "round",
        "line-join": "round"
    },
    "paint": {
        "line-width": 5,
        "line-color": "#122b3e",
        "line-opacity": 1
    }
}
```

需要注意的是，除了类型为 `background` 的图层，其他层必须指定一个 `source`，而当源的类型是矢量瓦片（如 `type: 'vector'`），就必须为图层指定 `source-layer`。详细配置请参考[官方文档](https://www.mapbox.com/mapbox-gl-js/style-spec/#sources)。

## 一点感想

最初因为需要在内网里展示地区可视化数据，最大的展示面积不超过一个行政市。在技术选型上，使用代理请求 Mapbox 瓦片使得渲染时间太长，对 3-4 人的小型前端团队来说使用专门服务器维护 geoserver 数据库在时间、人力成本上太高，才有搭建静态矢量瓦片服务这个想法。花了一周从一个完全没有接触过 WMS 的小白 到到处搜刮数据 到折腾 QGIS 到各种开源工具生成瓦片，填补了很多知识盲区，同时也打开了更多新世界的大门。瓦片服务是一个涉及了数据库、GIS 等方方面面的领域，每一个新名词都可以深入展开介绍几万字【……这篇文章记录一下搭建离线资源的踩坑历程，当做是进一步入门 webgis 的敲门砖吧~🙈

## 相关阅读

- [Mapbox GL JS 学习笔记](https://zhuanlan.zhihu.com/c_139752171)
- [Mapbox MBTiles 介绍](https://www.mapbox.com/help/how-mapbox-works/)
