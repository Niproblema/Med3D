/**
 * Created by Primoz on 2. 08. 2016.
 */

"use strict";

var regLogical = new RegExp("#if|#else if|#else|#fi",'gi');
var regAndOr = new RegExp("(\&\&|[|]{2})", 'gi');


var ShaderBuilder = class {
    constructor() {

    }


    buildShader(shaderTemplate, flags) {
        // Read shader source from file
        var shaderSource = this._readShader(path);

        // Parse if's
        var result = this._parseIfs(shaderSource, flags);

        return result;
    }



    _parseIfs (source, flags) {

        // region Build flag match regex
        var trueFlagsStr = "";
        var falseFlagsStr = "";

        for (var i = 0; i < flags.length; i++) {
            trueFlagsStr += flags[i];
            falseFlagsStr += "!" + flags[i];

            if (i !== flags.length - 1) {
                trueFlagsStr += "|";
                falseFlagsStr += "|";
            }
        }

        var flagTrueReg = new RegExp(trueFlagsStr, 'gi');
        var flagFalseReg = new RegExp(falseFlagsStr, 'gi');
        // endregion

        // region Operation checker
        var isIf = function () {
            return source.substring(regLogical.lastIndex - 2, regLogical.lastIndex).toUpperCase() === "IF"
        };

        var isElse = function () {
            return source.substring(regLogical.lastIndex - 4, regLogical.lastIndex).toUpperCase() === "ELSE"
        };

        var isElseIf = function () {
            return source.substring(regLogical.lastIndex - 7, regLogical.lastIndex).toUpperCase() === "ELSE IF"
        };

        var isFi = function () {
            return source.substring(regLogical.lastIndex - 2, regLogical.lastIndex).toUpperCase() === "FI"
        };
        // endregion Operation checker

        // Converts the given string index to line num
        var indexToLine = function (index) {
            var temp = source.substr(0, index);
            var splitted = temp.split("\n");

            return {lineNum: splitted.length, charNum: splitted.pop().length + 1}
        };

        // region Condition checking
        // Fetches the condition and returns starting and ending index in source
        var fetchCondition = function (startIdx) {
            // Find opening bracket
            while (source[startIdx] !== "(") {
                // Check file length
                if (startIdx >= source.length) {
                    throw 'Unexpected end of file. Expected condition opening bracket.'
                }
                // Check for starting bracket
                else if (source[startIdx] !== " ") {
                    var meta = indexToLine(startIdx);
                    throw ("Expected opening bracket but found '" + source[startIdx] + "' (" + meta.lineNum + ":" + meta.charNum + ")");
                }

                startIdx++;
            }

            startIdx++;
            var endIdx = startIdx;

            var skip = 0;
            // Find closing bracket
            while (source[endIdx] !== ")" || skip > 0) {
                if (source[endIdx] === "(") {
                    skip++;
                }
                if (source[endIdx] === ")") {
                    skip--;
                }

                // Check file length
                if (endIdx > source.length) {
                    throw "Unexpected end of file. Expected condition closing bracket."
                }

                endIdx++;
            }

            // Check if too many opening or closing brackets
            if (skip != 0) {
                var meta = indexToLine(endIdx);
                throw "Invalid condition bracket placement. (" + meta.lineNum + ":*)"
            }

            // Remove empty space from the condition
            var conditionStr = source.substring(startIdx, endIdx).replace(/[ \n\r\t]/g, '')

            return {start: startIdx, end: endIdx + 1, str: conditionStr}
        };

        // Check the condition located next from the given index
        var checkCondition = function (condition) {

            // Parse flags
            var conditionStr = condition.str;
            if (falseFlagsStr !== "") {
                conditionStr = condition.str.replace(flagFalseReg, "false");
            }
            if (trueFlagsStr !== "") {
                conditionStr = conditionStr.replace(flagTrueReg, "true");
            }

            var condValues = conditionStr.split(/\&\&|[|]{2}/g);
            var condOperators = conditionStr.match(regAndOr);

            // Match returns null if no match
            if (condOperators == null) {
                condOperators = [];
            }

            // Replace unset flags
            for (var i = 0; i < condValues.length; i++) {
                var value = condValues[i].match(/[^()!]+/g)[0];
                condValues[i] = condValues[i].replace(/[^()!]+/g, (value === "true") ? value : false);
            }

            // Merge the condition
            conditionStr = condValues[0];

            for (var i = 0; i < condOperators.length; i++) {
                conditionStr += condOperators[i] + condValues[i + 1];
            }

            try {
                return eval(conditionStr);
            }
            catch (e) {
                var meta = indexToLine(condition.end);
                throw "Invalid condition. (" + meta.lineNum + ":*)"
            }
        };
        // endregion

        var writeContent = function (layer, content) {
            if (layer.elseStatement) {
                layer.elseStatement.content = content;
            }
            else if (layer.elseIfStatements) {
                layer.elseIfStatements[layer.elseIfStatements.length - 1].content = content;
            }
            else {
                layer.ifStatement.content = content;
            }
        };

        // Parse all of the conditional layers
        var noChange = false;
        while (!noChange) {
            var condSegments = [];
            var condSegment = {};

            var parsedIdx = 0;
            var level = 0;
            var condition;

            // Form layer
            while (regLogical.exec(source)) {
                if (isIf()) {
                    // ELSE IF STATEMENT
                    if (isElseIf()) {
                        if (level != 0) {
                            continue;
                        }

                        // region ERROR CHECK
                        if (condSegment.ifStatement === undefined || condSegment.elseStatement !== undefined) {
                            var meta = indexToLine(regLogical.lastIndex - 8);
                            throw "Unexpected ELSE IF. (" + meta.lineNum + ":" + meta.charNum + ")"
                        }
                        // endregion

                        // Write content to previous operator
                        writeContent(condSegment, source.substring(parsedIdx, regLogical.lastIndex - 8));

                        if (condSegment.elseIfStatements === undefined) {
                            condSegment.elseIfStatements = [];
                        }

                        // Fetch condition
                        condition = fetchCondition(regLogical.lastIndex);

                        // Store condition
                        condSegment.elseIfStatements.push({condition: condition});
                        parsedIdx = condition.end;
                    }

                    // If if statement is was already found. Increase depth and start ignoring
                    else if (condSegment.ifStatement) {
                        level++;
                    }
                    else {
                        // Write the data up to if
                        condSegment.preIfContent = source.substring(parsedIdx, regLogical.lastIndex - 3);

                        // Fetch condition
                        condition = fetchCondition(regLogical.lastIndex);

                        // Store condition
                        condSegment.ifStatement = {condition: condition};
                        parsedIdx = condition.end;
                    }
                }

                // ELSE STATEMENT
                else if (level == 0 && isElse()) {
                    // region ERROR CHECK
                    if (condSegment.ifStatement === undefined || condSegment.elseStatement !== undefined) {
                        var meta = indexToLine(regLogical.lastIndex - 5);
                        throw "Unexpected ELSE. (" + meta.lineNum + ":" + meta.charNum + ")"
                    }
                    // endregion

                    // Write content to previous operator
                    writeContent(condSegment, source.substring(parsedIdx, regLogical.lastIndex - 5));

                    parsedIdx = regLogical.lastIndex;

                    // Create else statement
                    condSegment.elseStatement = {};
                }

                // FINISHED IF STATEMENT
                else if (isFi()) {
                    // Close the sub level
                    if (level > 0) {
                        level--;
                    }
                    else {
                        writeContent(condSegment, source.substring(parsedIdx, regLogical.lastIndex - 3));
                        parsedIdx = regLogical.lastIndex;

                        // Push layer to layers group
                        condSegments.push(condSegment);
                        condSegment = {};
                    }
                }
            }

            // Check if all of the conditions are finished
            if (condSegment.ifStatement !== undefined) {
                throw "Conditions aren't closed correctly!"
            }

            // Finished
            if (condSegments.length === 0) {
                noChange = true;
                break;
            }

            // Remaining part without conditions
            var remaining = source.substring(parsedIdx, source.length);

            var condSegment;
            source = "";

            // Evaluate current layer condition
            for (var i = 0; i < condSegments.length; i++) {
                condSegment = condSegments[i];

                source += condSegment.preIfContent;

                // Check if the if condition evals to true
                if (checkCondition(condSegment.ifStatement.condition)) {
                    source += condSegment.ifStatement.content;
                    continue;
                }

                // Check if any of the else if conditions evals to true
                if (condSegment.elseIfStatements !== undefined) {
                    var wasTrue = false;
                    for (var j = 0; j < condSegment.elseIfStatements.length; j++) {
                        if (checkCondition(condSegment.elseIfStatements[j].condition)) {
                            source += condSegment.elseIfStatements[j].content;

                            wasTrue = true;
                            break;
                        }
                    }

                    // If any of the expressions was true continue
                    if (wasTrue) {
                        continue;
                    }
                }

                // Check if the else statement condition evals to true
                if (condSegment.elseStatement !== undefined) {
                    source += condSegment.elseStatement.content;
                }
            }

            source += remaining;
        }

        return source;
    }
};


module.exports = ShaderBuilder;