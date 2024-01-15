
// console.log('main.js')

// const dom = document.createElement('div')
// dom.id = 'app'
// document.querySelector("#root").append(dom)

// const textNode = document.createTextNode('test')

// dom.append(textNode)
// const textEl = {
//     type: "TEXT_ELEMENT",
//     props: {
//         nodeValue: "test",
//         children: []
//     }
// }

const createTextNode = (text) => {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: []
        }
    }
}
// const el = {
//     type: "div",
//     props: {
//         id: 'app',
//         children: [textEl]
//     }
// }

const createElement = (type, props, ...children) => {
    console.log(...children, children)
    return {
        type,
        props: {
            ...props,
            children
        }
    }
}
const textEl = createTextNode("heihei")
const App = createElement('div', { id: 'app' }, textEl)

const dom = document.createElement(App.type)
dom.id = App.props.id
document.querySelector("#root").append(dom)

const textNode = document.createTextNode(textEl.props.nodeValue)

dom.append(textNode)


// const el = document.createElement("div");
// el.innerText = "heihei";
// document.body.append(el);

// let i = 0;

// js单线程 执行逻辑阻塞后续渲染
// while (i < 10000000000000000) {
//     i++;
// }

// 任务调度器
// let taskId = 1
// function workLoop(deadline) {
//     taskId++;
//     let shouldYield = false
//     while (!shouldYield) {
//         // run task
//         console.log(`taskId:${taskId} run task`);
//         // dom

//         shouldYield = deadline.timeRemaining() < 1;
//     }
//     requestIdleCallback(workLoop);

// }
// requestIdleCallback(workLoop);
// 分治的思想，把每个dom树拆小，不会阻塞后续渲染；
// requestIdleCallback 函数

// 实现fiber架构
// 如何控制树渲染只渲染一定数量在一个任务中，链表结构
// child sibling 叔叔
