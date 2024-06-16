class Quantity {
    constructor(x, y, name, radius) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.radius = radius;
        this.color = '#1E90FF';
        this.parents = [];
        this.influences = {}; // positive or negative
        this.dependency_types = {}; // proportional or direct
        this.dragging = false;
    }

    drawCircle(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.font = "15px Arial";
        ctx.fillText(this.name, this.x + this.radius * 1.4, this.y);
    }

    addLink(node, influence, dependancy_type) {
        this.parents.push(node);
        this.influences[node.name] = influence;
        this.dependency_types[node.name] = dependancy_type;
    }

    resetLinks() {
        this.parents = [];
    }

    changeColor(newColor) {
        this.color = newColor; 
    }

    drawLines(ctx) {
        ctx.lineWidth = 1;
        this.parents.forEach(linkedNode => {
            if (this.influences[linkedNode.name] == 1) {
                if (this.dependency_types[linkedNode.name] == 1) { ctx.strokeStyle = 'cornflowerblue'; }
                else { ctx.strokeStyle = 'green'; };
            } else {
                if (this.dependency_types[linkedNode.name] == 1) { ctx.strokeStyle = 'red'; }
                else { ctx.strokeStyle = 'coral'; };
            }

            // Calculate the unit vector in direction of the arrow
            var distance = Math.sqrt(Math.pow(this.x - linkedNode.x, 2) + Math.pow(this.y - linkedNode.y, 2));
            var unitX = (this.x - linkedNode.x) / distance;
            var unitY = (this.y - linkedNode.y) / distance;
            
            // Calculate the starting and end coordinates based on the unit vectors
            var startX = linkedNode.x + this.radius * unitX;
            var startY = linkedNode.y + this.radius * unitY;
            var endX = this.x - this.radius * unitX;
            var endY = this.y - this.radius * unitY;

            var headLength = 10;
            var angle = Math.atan2(this.y - linkedNode.y, this.x - linkedNode.x);

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
            
        });
    }

};

// Set canvas width and height to the size of the parent container
function setSizeCanvas(canvas) {
    canvas.width = canvas.parentElement.clientWidth; 
    canvas.height = canvas.parentElement.clientHeight;
};

function isNumber(string){
    return (!isNaN(string));
}

function evaluateDependacies(formula) {
    let dependancies = {};
    let dependancie_types = {};
    let sign = 1; // Start with a positive influence
    let signStack = [1]; // Stack to keep track of signs within brackets
    let tempSign = false; // Bool to keep treack of divisions

    const regex = /([a-zA-Z]+|[0-9]+|[\+\-\*\/\^\**\(\)])/g;
    const tokens = formula.match(regex);

    let i=0;
    tokens.forEach(token => {
        if (token === '+') {
            sign = 1 * signStack[signStack.length - 1];
        } else if (token === '-') {
            sign *= -1 * signStack[signStack.length - 1];
        } else if (token === '*') {
            // do nothing
        } else if (token === '/') {
            sign *= -1;
            tempSign = true;
        } else if (token === '^' || token === '**') {
            // do nothing
        } else if (token === '(') {
            signStack.push(sign);
        } else if (token === ')') {
            signStack.pop();
            if (tempSign) {
                sign *= -1;
                tempSign = false;
            }
        } else if (isNumber(token)) {
            // Do nothing
        } else {
            dependancies[token] = sign;
            if (tokens[i+1] === '*' && (tokens[i+2] === 't' || tokens[i+2] === 'dt')) {
                dependancie_types[token] = 1; 
            } else if (tokens[i+1] === '/' && (tokens[i+2] === 't' || tokens[i+2] === 'dt')) {
                dependancie_types[token] = 1;
            } else if (tokens[i+1] === '**' && (tokens[i+2] === 't' || tokens[i+2] === 'dt')) {
                dependancie_types[token] = 1;
            } else {
                dependancie_types[token] = 0;
            }
        }

        i++
    });

    return [dependancies, dependancie_types];
}

const canvas = document.getElementById("canvas-1");
const ctx = canvas.getContext("2d");
const error_box = document.getElementById("error-explanation"); 
setSizeCanvas(canvas);
var nodes = [];

export function drawCanvas(quantitiesDict) {
    var nodeMap = {};
    var newNodes = [];

    nodes.forEach(node => {
        nodeMap[node.name] = node;
    });

    for (let quantity in quantitiesDict) {
        if(nodeMap[quantity]) {
            newNodes.push(nodeMap[quantity]);
        } else {
            var x = Math.random() * (canvas.width - 100) + 50;
            var y = Math.random() * (canvas.height - 100) + 50;

            var node = new Quantity(x, y, quantity, canvas.width*0.025);

            newNodes.push(node);
        }
    }

    nodes = newNodes;
    let undefinedVars = [];

    nodes.forEach(node => {
        node.resetLinks();
        var parents = quantitiesDict[node.name].match(/[a-zA-Z]+/g);

        if (parents) {
            let dependancies = evaluateDependacies(quantitiesDict[node.name]);
            let influences = dependancies[0];
            let types = dependancies[1];
            parents = parents.filter(parent => parent !== node.name && parent !== "dt" && parent !== "t");

            parents.forEach(parent => {
                let index = nodes.findIndex(obj => obj.name === parent);
                if (index!=-1){
                    let influence = influences[parent];
                    let type = types[parent];
                    node.addLink(nodes[index], influence, type);
                } else {
                    undefinedVars.push(parent);
                }  
            });
        }
    });

    if (undefinedVars.length == 0) {
        error_box.innerHTML = " ";
    } else if (undefinedVars.length == 1) {
        error_box.innerHTML = undefinedVars[0] + " is undefined";
    } else {
        error_box.innerHTML = undefinedVars.join(', ') + " are undefined";
    }

    function drawNodes() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        nodes.forEach(node => {
            node.drawCircle(ctx);
            node.drawLines(ctx);
        })
    }

    drawNodes();

    let selectedNode = null;
    let isMouseDown = false;
    let mousePosition = { x: 0, y: 0 };

    function getMousePosition(event) {
        var rect = canvas.getBoundingClientRect();
        mousePosition = {
            x: event.x - rect.left,
            y: event.y - rect.top
        }

    }

    function intersects(node) {
        const areaX = mousePosition.x - node.x;
        const areaY = mousePosition.y - node.y;
        return areaX * areaX + areaY * areaY <= node.radius * node.radius; // check if mouse X and Y are within the radius of a node
    }

    function move(event) {
        if (!isMouseDown) return;

        getMousePosition(event);

        if (selectedNode) {
            selectedNode.x = mousePosition.x;
            selectedNode.y = mousePosition.y;
            drawNodes();
        }
    }

    function setDraggable(event) {
        if (event.type === "mousedown") {
            isMouseDown = true;
            getMousePosition(event);
            nodes.forEach(node => {
                if (intersects(node)) {
                    selectedNode = node;
                }
            });
        } else if (event.type === "mouseup") {
            isMouseDown = false;
            selectedNode = null;
        }
    }

    canvas.addEventListener('mousedown', setDraggable, false);
    canvas.addEventListener('mouseup', setDraggable, false);
    canvas.addEventListener('mousemove', getMousePosition, false);
    canvas.addEventListener('mousemove', move, false);

}

export function markConstants(historyDict) {
    for (let quantity in historyDict) {
        if (quantity === "t" || quantity === 'dt') {
            continue;
        }

        let quantityHistory = historyDict[quantity];

        if (quantityHistory[0] == quantityHistory[quantityHistory.length-1]) {
            let index = nodes.findIndex(obj => obj.name === quantity);
            let markedNode = nodes[index];
            markedNode.changeColor('#FF7F50');
            markedNode.drawCircle(ctx);
        }

    }

}



/*






var variables = ["mass", "tension", "length", "frequency", "pitch"];
var xCoordinates = [100, 200, 300, 100, 300];
var yCoordinates = [100, 100, 100, 400, 400];

var quantities = [];

for (var i = 0; i < variables.length; i++) {
    var node = new Quantity(xCoordinates[i], yCoordinates[i], variables[i]);
    quantities.push(node);
}

quantities[0].addLink(quantities[3]);
quantities[1].addLink(quantities[3]);
quantities[2].addLink(quantities[3]);
quantities[3].addLink(quantities[4]);

for (var i = 0; i < quantities.length; i++) {
    quantities[i].drawCircle(ctx);
    quantities[i].drawLines(ctx);
}
*/