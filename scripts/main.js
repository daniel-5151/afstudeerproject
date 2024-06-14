/*
TODO:
    - calculateQuantitiesHist() veranderen naar werken met dict
    - Probleem met de x-as
    - Proportioneel/direct verband toevoegens
    - Canvas wordt 'live' getekend
*/

import { drawCanvas, markConstants } from './qualitative.js';
import { generatePlot, calculateQuantitiesHist } from './quantitative.js';

function processInput(userInput, type) {
    var variables = {};
    var linesArray = userInput.split("\n"); // Put each line as an element in an array 
    
    linesArray.forEach(element => {
        var parts = element.split("="); // Split the expression at the =-sign
        
        if (parts.length == 2) {
            var name = parts[0].trim();
            if (type == "quantity") {
                var value = parts[1].trim();
            } else if (type == "rules") {
                var value = parts[1].trim();
            } else {
                console.log("Error");
                return;
            }
            variables[name] = value; // Enter expression into the variables dictionary
        } else {
            return; // Handle wrong input
        }
    });
    return variables;
}

function removeDuplicates(startingValues, modelRules) {
    var allQuantities = Object.assign({}, modelRules);

    for (let key in startingValues) {
        if (!allQuantities.hasOwnProperty(key)) {
            allQuantities[key] = startingValues[key];
        }
    }

    return allQuantities;
}

function updateCanvas() {
    var rulesInput = document.getElementById("model-rules").value;
    var startInput = document.getElementById("start-values").value;

    var input1 = processInput(startInput, "quantity");
    var input2 = processInput(rulesInput, "rules");

    var quantiesDict = removeDuplicates(input1, input2);

    drawCanvas(quantiesDict);
}

document.getElementById('model-rules').addEventListener('input', updateCanvas);
document.getElementById('start-values').addEventListener('input', updateCanvas);

document.getElementById('tempButton').addEventListener('click', function() {
    // Recieve input from the user
    document.getElementById('error-explanation').innerHTML = '';
    var rulesInput = document.getElementById("model-rules").value; 
    var startInput = document.getElementById("start-values").value;
    var iterations = document.getElementById("iterations").value;

    // Process the input
    var input1 = processInput(startInput, "quantity");
    var input2 = rulesInput.split("\n");

    var dataHistory = calculateQuantitiesHist(input1, input2, iterations);
    markConstants(dataHistory);
    generatePlot(dataHistory);
})

// var input1 = {x: '0', v: '0', a: '3.0'};
// var input2 = ['v=v+a*dt', 'x=x+v*dt'];
// var input3 = {v: 'v-a*dt', x: 'x+v*dt'};
// var input1 = {y: '2000', v: '0', g: '9.81', m: '20'}
// var input2 = ['Fz=m*g', 'Fw=0.1*v**2', 'Fres=Fz-Fw', 'a=Fres/m', 'v=v+a*dt', 'y=y-v*dt']
// var input3 = {Fres: "Fz-Fw", Fw: "0.1*v**2", Fz: "m*g", a: "Fres/m", v: "v+a*dt", y: "y-v*dt"}