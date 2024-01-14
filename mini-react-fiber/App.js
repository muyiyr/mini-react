import React from './core/React.js'

const textEl = React.createTextNode("app");
const App = React.createElement("div", { id: "app" }, textEl, "-app1");

export default App