---
title: 踩坑：使用 Jest+Enzyme 对 AntD/dva 项目进行单元测试
tags:
  - unit-test
  - react
categories:
  - JavaScript
date: 2018-01-15 13:57:48
---

> 这篇文章并不是前端单测入门介绍

## 这是一篇流水账

最近这两个星期的开发任务比较少，又开始一边写用例一边疯狂踩坑。毕竟项目本身直接上 [dva](https://github.com/dvajs/dva)，对 react/redux/redux-saga 的封装度比较高，而且用的也是蚂蚁的 [AntD](https://ant.design/) 的组件库，有时候需要测试某个组件的时候需要绕过很多 dva 和 AntD 的实现，导致经常一个组件的三四个用例就能写一个上午，甚至为了解决一些魔性的 warning 去学习了 [redux-saga](https://redux-saga.js.org/) 的原理以及……翻了 dva 的源码【？？？而且 [Jest](https://facebook.github.io/jest/) 和 [Enzyme](http://airbnb.io/enzyme/) 本身也有些 known bug 需要魔改的 work around，所以在搭建整个测试的框架的时候也用上了官方的 [Test Utilities](https://reactjs.org/docs/test-utils.html) 库和 [jsdom](https://github.com/tmpvar/jsdom)。这里就认真记录一下踩到的坑们吧~

<!-- more -->

## 坑们

### Jest 的 Mock 全局检测文件名

> https://github.com/facebook/jest/issues/2070

当开启 automock（这是默认行为）的时候，jest 是全局检测所有的 mockfile 的名称，因此即使 mockfile 放在不同的路径下面，如果他们的文件名本身（不包括 path 的 basename）相同，如 `a/__mocks__/services.js` 和 `b/__mocks__/services.js`，就会使 Jest 抛出错误，目前这个还是只个 warning，看起来是 Jest 本身的 Manual Mocks 系统仍然不完善，官方并没有给出解决方案，因此我们仍然需要手动引入需要 mock 的文件。

```JavaScript
//work around
import * as services from '../services';

jest.disableAutomock();
jest.mock('../services', () => require('../_mocks_/services'));
```

### 组件测试时建立最小的 dva 实例

在正常开发时，如果一个组件下的 `state` 和 `dispatch`是通过 `connect()` 传入的，dva 已经帮我们完成 router 和 store 的创建，并直接通过 `<Provider />` 将 store 传入组件。然而在测试的时候，这样一套的封装流程会使真实需要测试的组件代码在虚拟 DOM 的节点非常深，如果使用 Shallow Rendering，在使用 dva 路由的情况下，可能需要从 `wrapper` 使用 `dive()` 进行 3、4 次才能找到需要的组件。

```HTML
<!-- 没有使用路由的情况下，需要 dive 两层才能找到真实组件 -->
<Component>
    <Provider store={{...}}>
        <MyButton>
            <button onClick={[Function]}>before click</button>
        </MyButton>
    </Provider>
</Component>
```

于是我们利用 dva 创建 Redux store，在测试时直接渲染组件本身，并将需要的 `state` 和 `dispatch` 从 dva 获取后手动传入。(这里的 `MyButton` 组件是没有被 `connect()` 包裹的原始组件)

```JavaScript
// work around
// __test__/MyButton.test.js
import React from 'react';
import { shallow } from 'enzyme';
import { MyButton } from '../MyButton';
import model from '../myButtonModel';

let wrapper, app;
beforeAll(() =>{
  app = dva()
  app.model(model);
  app.router(() => {});
  app.start();
  wrapper = mount(<MyButton dispatch={app._store.dispatch}
    button={app._store.getState().button} />);
})
afterAll(() => {
  wrapper.unmount();
})
// ... test code ...
```

在 `wrapper` 上使用 `debug()` 检视一下组件渲染情况，这样获得的 `wrapper` 便是 `MyButton` 组件的 Shallow Wrapper 实例，可以直接在上面进行操作了：

```HTML
<MyButton dispatch={[Function]} button={{...}}>
    <button onClick={[Function]}>before click</button>
</MyButton>
```

### 组件内部有监听路由变化的逻辑

由于需要监听路由变化，组件需要依赖 `context` 中的 `router` 属性来获取 `history` 对象。在一个 dva 实例里，这个 `router` 是由 dva 创建并加载到根元素的 `childContext` 里的，根据这点我从最小 dva 实例作为起点，开始了几个尝试：

1. 渲染最小 dva 实例，直接使用 react-router 的 `createBrowserHistory()` 等方法直接创建一个 `router` 实例并手动加入组件的 `childContext` 传给 `<Link />` 标签使用。结果：报错。_如果组件里面使用了 `<Link />` 等 react-router 的标签，就必须把组件包裹在一个 `<Router />` 标签里。_

2. 依赖 dva 的 router，创建一个完整的 dva 实例并照常进行测试。结果：模拟对 `<Link />` 的点击或是直接使用 `app._history.pushState(nextState); app._history.goForward()` 均无效。_猜测是 `<BrowserRouter />` 在非浏览器环境下无法正常运行。_

3. 按照 2 创建完整 dva 实例，将 `<BrowserRouter />` 换为 `<Router />`，并通过 `createMemoryRouter()` 创建 router 实例。（其实这里直接使用 `<MemoryRouter />`也是可以的，但单独声明 `history` 能够更灵活地在其他 test case 中操纵路由跳转）结果：成功。

```JavaScript
// work around
// __test__/MyButton.test.js
import React from 'react';
import { shallow, mount } from 'enzyme';
// 因为直接传入 <Route /> 中，这里的 MyButton 组件
// 已被 withRouter() 以及 connect() 包裹
import MyButton from '../MyButton';
import model from '../myButtonModel';
import { createMemoryHistory, Router, Route, Switch } from 'react-router'

let app, wrapper, history;
beforeAll(() => {
  history = createMemoryHistory();
  app = dva();
  app.model(model);
  app.router(() => {
    <Router history={history}>
      <Switch>
        <Route exact path="/" component={MyButton} />
        <Route path="/other_path" render={<div>Other Path</div>}>
      </Switch>
    </Router>
  })
  let App = app.start();
  wrapper = mount(<App />);
})
// ... test code ...

//myButtonModel.js
export default {
  namespace: 'myButton',
  state: {}, reducers: {}, effects: {},
  subscriptions: {
    setup({ history, dispatch }) {
      return history.listen(({ pathname }) => {
        console.log(pathname)
      });
    },
  },
}
```

在测试环境下，通过 subscriptions 可以顺利在实例创建期间使用 `history.listen()` 监听路由变化了。

### Shallow Rendering 的几个坑

#### 1. Enzyme 的 shallow 渲染的 ref 属性无效

> https://github.com/airbnb/enzyme/issues/316

Enzyme 的文档里，在 Shallow Rendering 的章节并没有提及 `ref()` 函数，在实践中，假设我有一个这样的组件，组件内部靠使用 `ref` 给父组件传递元素：

```JavaScript
// MyButton.js
import React from 'react';
export class MyButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = { text: 'before click' };
    }
    render() {
        return (
            <div>
                <button data-text={this.state.text} ref={this.props.wrappedRef}
                    onClick={() => { this.setState({ text: 'after click' }); }}>
                    {this.state.text}</button>
            </div>
        );
    }
}
```

如果用例中使用 `shallow()` 来渲染

```JavaScript
let saveBtn = jest.fn(btn => {
    if (btn) btnNd = btn;
});
let wrapper = mount(<MyButton wrappedRef={saveBtn} />);
```

这时候如果检测 `btn` 会发现它的值是 `undefined`。然而使用 `mount()` 能正确获得这个 `ref` 引用的元素：

```JavaScript
// work around
// __test__/MyButton.test.js
import React from 'react';
import { shallow, mount } from 'enzyme';
import MyButton from '../MyButton';

test('ref test', () => {
    let btnNd;
    let saveBtn = jest.fn(btn => {
        if (btn) btnNd = btn;
    });
    let wrapper = mount(<MyButton wrappedRef={saveBtn} />);

    wrapper.find('button').simulate('click');
    expect(btnNd.dataset.text).toBe("after click") // pass
});
```

同时，如果是 [Uncontrolled Component](https://reactjs.org/docs/uncontrolled-components.html) 例如有 `ref` 属性的 `<input>` 直接在这个 component 上用 `simulate` 也无法触发模拟事件。如需触发模拟事件，需要将组件渲染至虚拟 DOM 里，并手动编写 DOM 的事件触发代码，如

```JavaScript
// work around
let input = document.getElementById('my-input');
input.addEventListener('keydown', (e) => { e.target.value = e.key });
let evnt = new KeyboardEvent('keydown', { key: '1'});
input.dispatchEvent(evnt);
console.log(input.value); // 1
```

#### 2. Redux 状态更新后视图层不自动更新

> https://github.com/airbnb/enzyme/issues/465

如果通过建立最小 dva 实例的方法来创建一个组件的 wrapper，将 Redux 的 state 当做 `props` 传入一个组件，且通过视图层的交互（如点击一个按钮，在 `onClick` 的事件处理里更新 state）来更新 Redux store 的状态，在 state 改变之后视图层不会主动重新渲染。之前以为是更新 state 存在异步行为，但是在测试过 `setTimeout()`, `setImmediate()` 和 `process.nextTick()`等方案均无果后，我们发现 **由于 `shallow()` 不会主动调用 `componentWillReceiveProps()` 等更新的钩子函数，要更新视图层，需要调用 Enzyme 的 `setProps()` 函数来触发钩子函数的调用。** 之前不太熟悉 dva 的 API，在每个 test case 前面都加了更新的代码，其实只需在创建 dva 实例时给 `onStateChange` 钩子加上 handler 就好了~

```JavaScript
app = dva({
  onStateChange: () => {
    wrapper &&
    wrapper.setProps({app._store.getState().button})
  }
})
```

然而这样只能保证在每个 test case 开始之前组件的视图层都处于最新状态；如果在 test case 里面更新了 Redux 的 state 后需要 assert，那还是要手动调用一次 `setProps()`。【(/"≡ _ ≡)/~┴┴ 我也觉得这样的写法太脏了，如果小天使们发现有更好的解决方法欢迎在评论里分享呀~】

### 自定义的事件的触发

AntD 的某些组件，例如 Modal 在浅渲染时，组件自带的 Button 会被生成在渲染树很深的节点，无法简便地通过触发目标元素的 `onClick` 事件来触发 Modal 的 `onOk`、`onCancel` 等事件；在使用 Mount Rendering 时，`simulate()` 无法模拟自定义的事件，例如 AntD Input.Search 上的 `onSearch` 事件，会抛出以下错误：

```JavaScript
TypeError: ReactWrapper::simulate() event 'search' does not exist
```

这类无法直接在组件本身触发事件的情况其实不一定要用 `simulate` 来解决，这些 `onSearch`, `onOk` 事件本身也是赋值在组件上的属性，它们的值是普通的回调函数，因此可以直接通过 `prop()` 来获取并调用。

```JavaScript
// work around
import React from 'react';
import { mount } from 'enzyme';
import { Input } from 'antd';

let wrapper;
let searchText = 'search text';
let Search = Input.Search;
let mockSearch = jest.fn(text => {
    console.log(text);
});

beforeAll(() => {
    wrapper = mount(
        <div><Search onSearch={mockSearch} /></div>
    );
});
afterAll(() => {
    wrapper.unmount();
});
test.only('event test', () => {
    wrapper.find('Search').prop('onSearch')(searchText);
    expect(mockSearch).toBeCalledWith(searchText);
});
```

## 吐槽

接触 React 已经两个月了。这两个月里接触了 redux, react-router, redux-saga，以及在项目上大量使用 dva 和 AntD。然而上面的经验都是从实践中得来的，还没来得及去翻看全家桶的源码，从底层明白这些坑是怎么产生的，以至于有时候走了很多弯路。如果今后测试过程中发现了其他值得提及的点，也会来更新哒！(｀ ∀´)Ψ
