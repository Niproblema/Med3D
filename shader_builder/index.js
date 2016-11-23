/**
 * Created by Primoz on 2. 08. 2016.
 */

var ShaderBuilder = require('./ShaderBuilder.js');
var fs = require('fs');

var shaderBuilder = new ShaderBuilder();

var templateName = "test6.txt";
var templateSource = fs.readFileSync(templateName, "utf8");

shaderBuilder.buildTemplateTree(templateName, templateSource);


if (shaderBuilder.hasTemplate(templateName)) {
    console.log("SHADER CODE:");
    console.log(shaderBuilder.fetchShader(templateName, ["A"], {"z": 6}));
}
