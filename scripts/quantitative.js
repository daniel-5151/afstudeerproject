// import { markConstants } from "./qualitative";

export function calculateQuantitiesHist(startingValues, modelRules, iterations) {
    var quantities = Object.assign({}, startingValues); // Copy the staring values to a new dictionary
    var dataHistory = {};
    modelRules.push('t=t+dt');
    quantities["t"] = '0';
    quantities["dt"] = document.getElementById("dt").value;
    for (let i=0; i<iterations; i++) {
        modelRules.forEach(rule => {
            if (rule.trim() === "") {
                return; // Skip this iteration if the rule is an empty string
            }

            var parts = rule.split("=");
            var variable = parts[0].trim();
            var expression = parts[1].trim();
    
            for (let key in quantities) {
                var regex = new RegExp("\\b" + key + "\\b", "g"); 
                expression = expression.replace(regex, quantities[key]); // Replace variable name with its current value
            }

            expression = expression.replace(/--/g, '+'); // Consecutive minus signs causes errors during evaluation
            
            try{
                quantities[variable] = eval(expression); // Calculate the new value based on expression
            } catch (error) {
                document.getElementById("error-explanation").innerHTML = "Error evaluating expression:" + parts[1] + ' ' + error;
                console.error("Error evaluating expression:", error); // Error if expression cannot be calculated
            }
            
        });

        for (let key in quantities) {
            if (!dataHistory[key]) { // Make new key if it does not exist in the dictionary
                dataHistory[key] = [];
            }
            dataHistory[key].push(quantities[key]); // Put current values in the history array
        }
    }

    // markConstants();
    return dataHistory;
}

export function generatePlot(historyDict) {
    let traces = [];

    for (let key in historyDict) {
        if (key == "t" || key == "dt") { continue; } // Time and timesteps do not have to be on the y-axis

        traces.push({ // Put remaining variables on the y-axis
            x: historyDict["t"],
            y: historyDict[key],
            type: "scatter",
            mode: "lines",
            name: key
        })
    }

    const layout = {
        xaxis: {title: "Time (S)"},
        yaxis: {title: "Quantity"}
    };

    Plotly.newPlot("plot1", traces, layout); // Show the plot
}