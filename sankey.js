
var d3;
var svg;

var makeBtn = document.getElementById('make');
var closeBtn = document.getElementById('close');
var zoomBtn = document.getElementById('zoom');

const width = document.getElementById("sankey-display").offsetWidth,
      height = document.getElementById("sankey-display").offsetHeight;

const baseSize = 100;

var nodes;
var nodeHandles;
var links;

var outputs;
var inputs;
var difference;

var sankeyIsMade = false;
var editingMode = false;

var mydragg = function(){
    return {
        move : function(divid,xpos,ypos){
            divid.style.left = xpos + 'px';
            divid.style.top = ypos + 'px';
        },
        startMoving : function(divid,container,evt){
            evt = evt || window.event;
            var posX = evt.clientX,
                posY = evt.clientY,
                divTop = divid.style.top,
                divLeft = divid.style.left,
                eWi = parseInt(divid.style.width),
                eHe = parseInt(divid.style.height),
                cWi = parseInt(document.getElementById(container).style.width),
                cHe = parseInt(document.getElementById(container).style.height);
            document.getElementById(container).style.cursor='move';
            divTop = divTop.replace('px','');
            divLeft = divLeft.replace('px','');
            var diffX = posX - divLeft,
                diffY = posY - divTop;
            document.onmousemove = function(evt){
                evt = evt || window.event;
                var posX = evt.clientX,
                    posY = evt.clientY,
                    aX = posX - diffX,
                    aY = posY - diffY;
                if (aX < 0) aX = 0;
                if (aY < 0) aY = 0;
                if (aX + eWi > cWi) aX = cWi - eWi;
                if (aY + eHe > cHe) aY = cHe -eHe;
                mydragg.move(divid,aX,aY);
            }
        },
        stopMoving : function(container){
            document.getElementById(container).style.cursor='default';
            document.onmousemove = function(){}
        }
    }
}();


var eventX;
var eventY;

(function() {
    document.getElementById('sankey-display').onmousemove = handleMouseMove;
    function handleMouseMove(event) {
        var dot, eventDoc, doc, body, pageX, pageY;

        event = event || window.event; // IE-ism

        // If pageX/Y aren't available and clientX/Y are,
        // calculate pageX/Y - logic taken from jQuery.
        // (This is to support old IE)
        if (event.pageX == null && event.clientX != null) {
            eventDoc = (event.target && event.target.ownerDocument) || document;
            doc = eventDoc.documentElement;
            body = eventDoc.body;

            event.pageX = event.clientX +
                (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
                (doc && doc.clientLeft || body && body.clientLeft || 0);
            event.pageY = event.clientY +
                (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
                (doc && doc.clientTop  || body && body.clientTop  || 0 );
        }

        eventX = event.pageX;
        if(document.getElementById('sankey-details') == null){
            eventY = event.pageY;
        }else{
            eventY = event.pageY - document.getElementById('sankey-details').getBoundingClientRect().top - document.getElementById('sankey-details').getBoundingClientRect().height;
        }

       // console.log(eventX + " " + eventY);
    }
})();

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.

    // files is a FileList of File objects. List some properties.
    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
        // Only process image files.
        if (!f.type.match('image.*')) {
            continue;
        }

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function(theFile) {
            return function(e) {

                var imageContainer = document.createElement('div');

                imageContainer.id = 'imageContainer';
                imageContainer.className += "imageContainer";
                imageContainer.style.left = eventX + "px";
                imageContainer.style.top = eventY + "px";
                imageContainer.style.width = "100px";
                imageContainer.style.height = "100px";
                imageContainer.onmousedown = function(){mydragg.startMoving(imageContainer,'sankey-display',event)};
                imageContainer.onmouseup = function(){mydragg.stopMoving('sankey-display')};


                var image = document.createElement("img");

                imageContainer.appendChild(image);

                image.src = e.target.result;
                image.id = "image";
                image.style.width = "100%";
                image.style.height = "100%";

                image.ondragstart = function() { return false; };

                document.getElementById("banner").onmouseover = function(){mydragg.stopMoving('sankey-display')};
                //document.getElementById("sankey-create").onmouseover = function(){mydragg.stopMoving('sankey-display')};


                var resizer = document.createElement('div');
                resizer.className = 'resizer';
                resizer.style.backgroundColor = "#303336";
                resizer.style.width = "10px";
                resizer.style.height = "10px";
                resizer.style.right = "0px";
                resizer.style.bottom = "0px";
                resizer.style.cursor = "se-resize";
                resizer.style.position = "absolute";
                resizer.style.display = "none";
                imageContainer.appendChild(resizer);

                imageContainer.onmouseover = function(){
                    imageContainer.addEventListener('mouseover', function init() {
                        imageContainer.removeEventListener('mouseover', init, false);
                        imageContainer.className = imageContainer.className + ' resizable';

                        resizer.style.display = null;

                        resizer.onmousedown = function(e){
                            imageContainer.onmousedown = function(){};
                            imageContainer.onmouseup = function(){};
                            initDrag(e, imageContainer)
                        };
                        resizer.onmouseup = function(){
                            imageContainer.onmousedown = function(){mydragg.startMoving(imageContainer,'sankey-display',event)};
                            imageContainer.onmouseup = function(){mydragg.stopMoving('sankey-display')};
                        };
                    }, false);
                };

                imageContainer.onmouseout = function(){
                    resizer.style.display = "none";
                };

                document.getElementById("sankey-display").appendChild(imageContainer);

                dnd("imageContainer");

                //document.getElementById("sankey-display").style.backgroundImage = "url('" + e.target.result + "')";

            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);
    }
    document.getElementById('sankey-display').addEventListener('change', handleFileSelect, false);
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

// Setup the dnd listeners.
var dropZone = document.getElementById('sankey-display');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);

var startX, startY, startWidth, startHeight;
var element;

function initDrag(e, elem) {
    element = elem;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
    startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
    document.documentElement.addEventListener('mousemove', doDrag, false);
    document.documentElement.addEventListener('mouseup', stopDrag, false);
}

function doDrag(e) {
    element.style.left = startX;
    element.style.top = startY;
    element.style.width = (startWidth + e.clientX - startX) + 'px';
    element.style.height = (startHeight + e.clientY - startY) + 'px';
}

function stopDrag(e) {
    document.documentElement.removeEventListener('mousemove', doDrag, false);    document.documentElement.removeEventListener('mouseup', stopDrag, false);
}

    function makeNodes(){

        nodes = [];
        //make input node
        nodes.push({
            name: "Input",
            value: inputs[0].value,
            displaySize: baseSize,
            width: 300,
            x: 150,
            y:0,
            input: true,
            difference: false,
            inter: false,
            top: false,
            units: inputs[0].units
        });

        var i = 0;
        //take all the outputs and make nodes and internodes starting at input and going to output
        for(; i < outputs.length; i++){

            //top
            if(i%2 == 0) {
                nodes.push({
                    name: "inter #" + i,
                    value: 0,
                    displaySize: 0,
                    width: 0,
                    x: 400 + i*200,
                    y: 0,
                    input: false,
                    difference: false,
                    inter: true,
                    top: true,
                    units: outputs[i].units

                });

                nodes.push({
                    name: outputs[i].name,
                    value: outputs[i].value,
                    displaySize: 0,
                    width: 0,
                    x: 600 + i*200,
                    y: 0,
                    input: false,
                    difference: false,
                    inter: false,
                    top: true,
                    units: outputs[i].units
                });
            }
            //bottom
            else{
                nodes.push({
                    name: "inter #" + i,
                    value: 0,
                    displaySize: 0,
                    width: 0,
                    x: 450 + i*200,
                    y: 0,
                    input: false,
                    difference: false,
                    inter: true,
                    top: false,
                    units: outputs[i].units
                });

                nodes.push({
                    name: outputs[i].name,
                    value: outputs[i].value,
                    displaySize: 0,
                    width: 0,
                    x: 600 + i*200,
                    y: 0,
                    input: false,
                    difference: false,
                    inter: false,
                    top: false,
                    units: outputs[i].units
                });
            }
        }

        //make output node
        if(i%2 == 0) {
            nodes.push({
                name: difference.name,
                value: 0,
                displaySize: 0,
                width: 0,
                x: 400 + i*200,
                y: 0,
                input: false,
                difference: true,
                inter: false,
                top: true,
                units: difference.units
            });
        }
        else{
            nodes.push({
                name: difference.name,
                value: 0,
                displaySize: 0,
                width: 0,
                x: 450 + i*200,
                y: 0,
                input: false,
                difference: true,
                inter: false,
                top: false,
                units: difference.units
            });
        }
    }

    function linkNodes(){

        links = [];

        if(outputs.length > 0) {

            links.push({
                source: 0,
                target: 1,
                endWidth: 0
            });

            var source = 1;
            for (var i = 1; i <= outputs.length; i++) {

                links.push({
                    source: source,
                    target: source+1,
                    endWidth: 0
                });

                links.push({
                    source: source,
                    target: source+2,
                    endWidth: 0
                });

                source = source+2;
            }
        }
        else{
            links.push({
                source: 0,
                target: 1,
                endWidth: 0
            });
        }
    }

    function makeNodeHandles(){

        nodeHandles = [];

        nodes.forEach(function(d){
            nodeHandles.push({
                x: d.x,
                y: d.y,
                top: d.top
            });
        })
    }

    function updateNodeHandles(){
        if(nodeHandles != null) {
            for (var x = nodeHandles.length; x < nodes.length; x++) {
                addNodeHandle(x);
            }
        }
        else{
            for (var x = 0; x < nodes.length; x++) {
                addNodeHandle(x);
            }
        }
    }

    function addNodeHandle(i){

        nodeHandles.push({
            x: nodes[i].x,
            y: nodes[i].y,
            top: nodes[i].top
        });

    }


    function initDifference(){
        difference = {
            name: "Difference",
            units: ""
        };
    }

    var zoom = d3.zoom()
        .scaleExtent([.25, 100])
        .on("zoom", zoomed);

    var lastTransformX = 1;
    var lastTransformY = 1;
    var lastTransformK = 1;

    function zoomed() {
        lastTransformX = d3.event.transform.x;
        lastTransformY = d3.event.transform.y;
        lastTransformK = d3.event.transform.k;

        d3.select('svg').select('g').attr('transform', 'translate(' + d3.event.transform.x + ',' + d3.event.transform.y + ') scale(' + d3.event.transform.k + ')');
    }


    function makeSankeySVG(location){

        //Remove  all Sankeys
        d3.select(location).selectAll('svg').remove();

        lastTransformX = 1;
        lastTransformY = 1;
        lastTransformK = 1;

        svg = d3.select(location).append('svg')
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("class", "drop_zone")
            .attr("preserveAspectRatio", "xMinYMin")
            .attr("id", "sankey-svg")
            .style("position", "relative")
            .style("top", "-34px")
            .style("z-index", "0")
            .call(zoom)
            .append("g")
                .attr("class", "drop_zone");
    }

    function updateSankeySVG(){
        if(svg != null){
            svg
                .call(calcSankey)
                .call(findColor);
        }
    }


    function calcSankey() {
        var alterVal = 0;

        nodes.forEach(function (d, i) {
            d.y = (400 - nodes[0].displaySize/2);
            if (d.inter) {
                //Reset height
                if (i == 1) {
                    //First interNode
                    d.value = nodes[i - 1].value;
                    d.displaySize = calcDisplayValue(d.value);
                }
                else {
                    //Previous node.val - interNode.value
                    d.value = (nodes[i - 2].value - nodes[i - 1].value);
                    d.displaySize = calcDisplayValue(d.value);
                    if (d.top) {
                        d.y = d.y + alterVal;
                    }
                    else {
                        alterVal += (nodes[i - 2].displaySize - d.displaySize);
                        d.y = (d.y + alterVal);
                    }
                }
            }
            else {
                if(!d.input) {
                    if (d.difference) {
                        d.value = (nodes[i - 2].value - nodes[i - 1].value);
                        d.displaySize = calcDisplayValue(d.value);

                        if(outputs.length%2 != 0){
                            alterVal += (nodes[i - 2].displaySize - d.displaySize);
                        }

                        d.y = d.y + alterVal;
                        document.getElementById("differenceTable").childNodes[3].childNodes[1].value = d.value;
                    }
                    else {
                        if (d.top) {
                            d.displaySize = calcDisplayValue(d.value);
                            d.y -= nodes[i - 1].displaySize - alterVal;
                        }
                        else {
                            d.displaySize = calcDisplayValue(d.value);
                            d.y += (nodes[i - 1].displaySize * 2) + alterVal;
                        }
                    }
                }
            }
        });
    }

    function calcDisplayValue(val){
        return baseSize * (val/nodes[0].value);
    }

    function makeLinks(d){

        var points = [];

        if(nodes[d.source].input){
            points.push([nodes[d.source].x, (nodes[d.source].y+( nodes[d.source].displaySize/2))]);
            points.push([nodes[d.source].x+10, (nodes[d.source].y+( nodes[d.source].displaySize/2))]);
            points.push([nodes[d.target].x-5, (nodes[d.target].y+(nodes[d.target].displaySize/2))]);
            points.push([nodes[d.target].x, (nodes[d.target].y+(nodes[d.target].displaySize/2))]);
        }
        //If it links up with an inter or difference then go strait tot the interNode
        else if(nodes[d.target].inter || nodes[d.target].difference){
            if(nodes[d.source].top) {

                if(!nodes[d.source-1].input){
                    points.push([(nodes[d.source].x - 5), (nodes[d.source].y + ( nodes[d.target].displaySize / 2))+calcDisplayValue(nodes[d.source+1].value)]);
                    points.push([(nodes[d.source].x + 5), (nodes[d.source].y + ( nodes[d.target].displaySize / 2))+calcDisplayValue(nodes[d.source+1].value)]);
                }
                else{

                    points.push([(nodes[d.source].x - 5), (nodes[d.source].y + ( nodes[d.target].displaySize / 2))+calcDisplayValue(nodes[d.source+1].value)]);
                    points.push([(nodes[d.source].x + 5), (nodes[d.source].y + ( nodes[d.target].displaySize / 2))+calcDisplayValue(nodes[d.source+1].value)]);
                }
                points.push([nodes[d.target].x - 5, (nodes[d.target].y + (nodes[d.target].displaySize / 2))]);
                points.push([nodes[d.target].x, (nodes[d.target].y + (nodes[d.target].displaySize / 2))]);
            }
            else{
                points.push([(nodes[d.source].x - 5), (nodes[d.source].y + ( nodes[d.target].displaySize / 2))]);
                points.push([(nodes[d.source].x + 5), (nodes[d.source].y + ( nodes[d.target].displaySize / 2))]);
                points.push([nodes[d.target].x - 5, (nodes[d.target].y + (nodes[d.target].displaySize / 2))]);
                points.push([nodes[d.target].x, (nodes[d.target].y + (nodes[d.target].displaySize / 2))]);
            }

        }
        else {
            //Curved linkes
            if(nodes[d.target].top) {
                points.push([(nodes[d.source].x-5 ), (nodes[d.source].y+(nodes[d.target].displaySize/2))]);
                points.push([(nodes[d.source].x + 30), (nodes[d.source].y+(nodes[d.target].displaySize/2))]);
                points.push([(nodes[d.target].x ),(nodes[d.target].y + (nodes[d.target].displaySize / 2))]);
            }
            else {
                points.push([(nodes[d.source].x-5), ((nodes[d.source].y+nodes[d.source].displaySize)-(nodes[d.target].displaySize/2))]);
                points.push([(nodes[d.source].x + 30), (((nodes[d.source].y+nodes[d.source].displaySize)-(nodes[d.target].displaySize/2)))]);
                points.push([(nodes[d.target].x ),(nodes[d.target].y - (nodes[d.target].displaySize / 2))]);
            }
        }
        return linkGen(points);
    }

    function applyNodeHandles(){
        nodes.forEach( function(d, i){
            d.x = nodeHandles[i].x;
            d.y = nodeHandles[i].y;
            d.top = nodeHandles[i].top;
        })
    }

    function getEndMarker(d){
        if(!nodes[d.target].inter || nodes[d.target].difference) {
            return "url(" + window.location + "#end-" + d.target + ")";
        }
        else{
            return "";
        }
    }

    var color;
    var greaterColor = "#ff3300";
    var lesserColor = "#ffcc00";
    function findColor() {
        color = d3.scaleLinear()
            .domain([0, nodes[0].value])
            .range([lesserColor, greaterColor]);
    }

    function enterEditingMode(){

        var simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(function (d) {
                return d.id;
            }))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(svg.node().getBBox().width / 2, svg.node().getBBox().height / 2));

        var node = svg.append("g")
            .attr("class", "nodes remove")
            .selectAll("circle")
            .data(nodes)
            .enter().append("circle")
            .attr("r", 25)
            .attr("cx", function (d) {
                return d.x
            })
            .attr("cy", function (d) {
                return d.y + (d.displaySize / 2);
            })
            .attr("fill", "purple")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        function dragstarted(d, i) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();

            nodeHandles[i].x = nodes[i].x;
            nodeHandles[i].y = nodes[i].y;

            makeSankey('#sankey-display', false);
        }

        function dragged(d, i) {

            nodeHandles[i].x = (d3.event.x - $('#sankey-display').offset().left + $(window).scrollLeft() - lastTransformX) / lastTransformK;
            nodeHandles[i].y = (d3.event.y - $('#sankey-display').offset().top + $(window).scrollTop() - lastTransformY) / lastTransformK;

            if (nodes[i].top && !nodes[i].input && !nodes[i].inter && !nodes[i].difference && (nodeHandles[i].y > (nodes[i - 1].y + nodes[i - 1].displaySize))) {
                nodeHandles[i].top = false;
                nodeHandles[i - 1].top = false;
            }
            else if (!nodes[i].top && !nodes[i].input && !nodes[i].inter && !nodes[i].difference && (nodeHandles[i].y < nodes[i - 1].y)) {
                nodeHandles[i].top = true;
                nodeHandles[i - 1].top = true;
            }

            makeSankey('#sankey-display', false);
        }

        function dragended(d, i) {
            if (!d3.event.active) simulation.alphaTarget(0);
        }
    }

    var linkGen;
    var nodes_text;
    var nodes_units;
    var nodes_value;
    var offset = $('#sankey-display').offset();

    function makeSankey(location, isNewSankey){
        console.log("here");
        console.log(inputs);
        if(inputs != null) {
            console.log("now");
            sankeyIsMade = true;

            makeNodes();
            linkNodes();

            if(svg != null){
                svg.selectAll("*").remove();
            }

            if (isNewSankey) {
                makeSankeySVG(location);
                if(nodeHandles == null) {
                    nodeHandles = [];
                }
                document.getElementById("createSankeyBtn").style.display = "none";
            }
            updateSankeySVG();
            updateNodeHandles();

            //changes are applied
            applyNodeHandles();

            dnd("sankey-svg");

            links.forEach(function (d, i) {
                var link_data = d;
                svg.append("linearGradient")
                    .attr("id", function () {
                        return "linear-gradient-" + i;
                    })
                    .attr("gradientUnits", "userSpaceOnUse")
                    .attr("x1", nodes[link_data.source].x)
                    .attr("y1", function () {
                        if (nodes[link_data.target].inter || nodes[link_data.target].difference) {
                            return (nodes[link_data.target].y + (nodes[link_data.target].displaySize / 2));
                        }
                        else {
                            if (nodes[link_data.target].top) {
                                return nodes[link_data.source].y;
                            }
                            else {
                                return (nodes[link_data.source].y + nodes[link_data.source].displaySize);
                            }
                        }
                    })
                    .attr("x2", nodes[link_data.target].x)
                    .attr("y2", function () {
                        if (nodes[link_data.target].inter || nodes[link_data.target].difference) {
                            return (nodes[link_data.target].y + (nodes[link_data.target].displaySize / 2));
                        }
                        else {
                            return nodes[link_data.target].y;
                        }
                    })
                    .selectAll("stop")
                    .data([
                        {offset: "0%", color: color(nodes[link_data.source].value)},
                        {offset: "76%", color: color(nodes[link_data.target].value)}
                    ])
                    .enter().append("stop")
                    .attr("offset", function (d) {
                        return d.offset;
                    })
                    .attr("stop-color", function (d) {
                        return d.color;
                    });
            });

            svg.selectAll('marker')
                .data(links)
                .enter().append('svg:marker')
                .attr('id', function (d) {
                    return 'end-' + d.target;
                })
                .attr('orient', 'auto')
                .attr('refX', .1)
                .attr('refY', 0)
                .attr("viewBox", "0 -5 10 10")
                .style("border", "1px solid black")
                .attr("fill", function (d) {
                    return color(nodes[d.target].value);
                })
                .append('svg:path')
                .attr("d", "M0,-2.5L2,0L0,2.5");

            linkGen = d3.line()
                .curve(d3.curveMonotoneX);

            //Draw links to the svg
            var link = svg.append("g")
                .attr("class", "links remove")
                .selectAll("path")
                .data(links)
                .enter().append('path')
                .attr("d", function (d) {
                    return makeLinks(d);
                })
                .style("stroke", function (d, i) {
                    return "url(" + window.location + "#linear-gradient-" + i + ")"
                })
                .style("fill", "none")
                .style("stroke-width", function (d) {
                    return nodes[d.target].displaySize;
                })
                .attr('marker-end', function (d) {
                    return getEndMarker(d);
                });

            nodes_text = svg.selectAll(".nodetext")
                .data(nodes)
                .enter()
                .append("text")
                .attr("text-anchor", "middle")
                .attr("dx", function (d) {
                    if (d.input) {
                        return d.x - 70;
                    }
                    else if (d.difference) {
                        return d.x + (d.displaySize * .7) + 100;
                    }
                    else {
                        return d.x;
                    }
                })
                .attr("dy", function (d) {
                    if (d.input || d.difference) {
                        return d.y + (d.displaySize / 2);
                    }
                    else {
                        if (d.top) {
                            return d.y - 120;
                        }
                        else {
                            return d.y + 60;
                        }
                    }
                })
                .text(function (d) {
                    if (!d.inter) {
                        return d.name;
                    }
                })
                .style("font-size", "30px");

            nodes_units = svg.selectAll(".nodetext")
                .data(nodes)
                .enter()
                .append("text")
                .attr("text-anchor", "middle")
                .attr("dx", function (d) {
                    if (d.input) {
                        return d.x - 70;
                    }
                    else if (d.difference) {
                        return d.x + (d.displaySize * .7) + 100;
                    }
                    else {
                        return d.x;
                    }
                })
                .attr("dy", function (d) {
                    if (d.input || d.difference) {
                        return d.y + (d.displaySize / 2) + 95;
                    }
                    else {
                        if (d.top) {
                            return d.y - 20;
                        }
                        else {
                            return d.y + 160;
                        }
                    }
                })
                .text(function (d) {
                    if (!d.inter) {
                        return d.units;
                    }
                })
                .style("font-size", "30px");

            nodes_value = svg.selectAll(".nodetext")
                .data(nodes)
                .enter()
                .append("text")
                .attr("text-anchor", "middle")
                .attr("dx", function (d) {
                    if (d.input) {
                        return d.x - 70;
                    }
                    else if (d.difference) {
                        return d.x + (d.displaySize * .7) + 95;
                    }
                    else {
                        return d.x - 5;
                    }
                })
                .attr("dy", function (d) {
                    if (d.input || d.difference) {
                        return (d.y + (d.displaySize / 2)) + 45;
                    }
                    else if (d.top) {
                        return d.y - 65;
                    }
                    else {
                        return d.y + 110;
                    }
                })
                .text(function (d) {
                    if (!d.inter) {
                        return d.value;
                    }
                })
                .style("font-size", "30px");

            if (editingMode) {
                enterEditingMode();
            }
            else{
                d3.select("svg").style("border", "0px");
            }
        }
  }

function makeSankeyForm(){

    var form = document.getElementById("detailScreen");

    form.innerHTML +="   <div id='sankey-form' class='col-12' style='background-color: #f2f2f2;" +
        "                                                   padding: 0px;" +
        "                                                   position: relative;" +
        "                                                   overflow:hidden;" +
        "                                                   -webkit-box-shadow: 0px 1px 4px 0px rgba(0,0,0,0.5);" +
        "                                                   -moz-box-shadow: 0px 1px 4px 0px rgba(0,0,0,0.5);" +
        "                                                   box-shadow: 0px 3px 4px 0px rgba(0,0,0,0.5);" +
        "                                                   z-index: 4;" +
        "                                                   height: 100%;'>" +
        "<div id='sankey-details' class='row' style='padding-top: 5px; height: 100%;'>" +
        "           <div class='row' style='padding-top: 0px; apdding-bottom: 0px; padding-left: 20px; padding-right: 20px; overflow: scroll; overflow-y: hidden;'> " +
        "               <div style='width: 120px;  display: inline-block;'>" +
        "                   <table class='table table-bordered' style='margin: 0px;'>" +
        "                       <tbody>" +
        "                           <tr id='inputs'>" +
        "                               <td style='width:120px' class='text-center'>" +
        "                                   <h3 style='margin-top: 5px'>Input</h3>" +
        "                                   <div class='text-center'>" +
        "                                       <button class='btn btn-secondary btn-pop' onclick='addInput()' style='background-color: #7ec783'><span class='glyphicon glyphicon-plus'></span></button>" +
        "                                       <div style='width: 90px; padding-top: 10px;' >" +
        "                                           <i class='material-icons' style='position: relative; top: 5px'>palette</i>" +
        "                                           <input id='colorPaletteInput' style='padding-top: 10px;' />" +
        "                                       </div>" +
        "                                   </div>" +
        "                               </td>" +
        "                           </tr>" +
        "                           <tr id='outputs'>" +
        "                               <td style='width:120px' class='text-center'>" +
        "                                  <h3 style='margin-top: 5px'>Output</h3>" +
        "                                   <div class='text-center'>" +
        "                                       <button class='btn btn-secondary btn-pop' onclick='addOutput()' style='background-color: #7ec783'><span class='glyphicon glyphicon-plus'></span></button>" +
        "                                       <div style='width: 90px; padding-top: 10px;' >" +
        "                                           <i class='material-icons' style='position: relative; top: 5px'>palette</i>" +
        "                                           <input id='colorPaletteOutput' style='padding-top: 10px;' />" +
        "                                       </div>" +
        "                                   </div>" +
        "                               </td>" +
        "                           </tr>" +
        "                       </tbody>" +
        "                   </table>" +
        "               </div>" +
        "               <div id='differenceBox' style='width: 90px; display: inline-block; position: relative; left: -5px;'>" +
        "                   <table class='table table-bordered' style='width: 90px; height: 275px; margin: 0px;'>" +
        "                       <tr>" +
        "                           <td id='differenceTable'> " +
        "                               <h3 class='text-center' contenteditable='true' onchange='updateDifference()' style='margin-top: 12px'>" + "Difference </h3>" +
        "                               <div class='input-group'>" +
        "                                   <input type='text' class='form-control' aria-describedby='basic-addon1' onchange='updateDifference()  style='width: 160px -webkit-border-radius: 4px; -moz-border-radius: 4px; border-radius: 4px;' disabled>" +
        "                               </div>" +
        "                               <div class='input-group'>" +
        "                                   <span class='input-group-addon' id='basic-addon1'>Units</span>" +
        "                                   <input type='text' class='form-control' aria-describedby='basic-addon1' onchange='updateDifference()' style='width: 103px'/>" +
        "                               </div>" +
        "                           </td>" +
        "                       </tr>" +
        "                   </table>" +
        "               </div>" +
        "           </div>" +
        "       </div>" +
        "   </div>";

    $("#colorPaletteInput").spectrum({
        color: greaterColor
    });

    $("#colorPaletteOutput").spectrum({
        color: lesserColor
    });

    $("#colorPaletteInput").change( function(){
        greaterColor = $("#colorPaletteInput").spectrum("get").toHexString();
        update();
    });

    $("#colorPaletteOutput").change( function(){
        lesserColor = $("#colorPaletteOutput").spectrum("get").toHexString();
        update();
    });

    document.getElementById('fileSelector')
        .addEventListener('change', readSingleFile, false);

    initDifference();
}

function moveDiffrenceTable(){
    document.getElementById("differenceBox").style.left = ((columns * 177) - 17 + "px");
}

function toggleEditingMode(){
    if(sankeyIsMade) {
        if (editingMode) {
            editingMode = false;
        }
        else {
            editingMode = true;
        }

        update();
    }
}

var columns = 0;
var numberOfOutputs;

function output(name, value){
    //name will be used as a key
    this.name = name;
    this.value = value;
}

function addOutput(){

    if(numberOfOutputs == null){
        numberOfOutputs = 0;
    }

    var outputs = document.getElementById("outputs");

    var newOutput = document.createElement("td");
    newOutput.setAttribute("id", "output"+numberOfOutputs);
    newOutput.className = "output text-center";
    newOutput.style.paddingTop = "20px";

    newOutput.innerHTML =   "<h3 id='output-title"+ numberOfOutputs +"' contenteditable='true' onchange='loadOutputs()' style='margin-top: 0px'>" + "Output #" + (numberOfOutputs + 1) + "</h3>" +
                            "<div class='input-group'>" +
                                "<input type='text' class='form-control' aria-describedby='basic-addon1' id='outputInput" + numberOfOutputs + " ' onchange='loadOutputs()' style='width: 120px'/>" +
                                "<span class='input-group-addon' style='margin: 0; padding: 0; border: 0'>" +
                                "<button class='btn btn-secondary' onclick='deleteLoss("+numberOfOutputs+")' style='background-color: #8f3236'><span class='glyphicon glyphicon-minus'></span></button>" +
                            "</div>" +
                            "<div class='input-group'>" +
                                "<span class='input-group-addon' id='basic-addon1'>Units</span>" +
                                "<input type='text' class='form-control' aria-describedby='basic-addon1' id='outputUnits" + numberOfOutputs + " ' onchange='loadOutputs()' style='width: 103px'/>" +
                            "</div>";

    outputs.appendChild(newOutput);

    var inputs = document.getElementById("inputs");

    var newSpanner = document.createElement("td");
    newSpanner.setAttribute("id", "output-spanner"+numberOfOutputs);
    newSpanner.style.width = "157px";

    inputs.appendChild(newSpanner);

    columns++;

    moveDiffrenceTable();

    numberOfOutputs++;
}


function addSavedOutput(value, units){

    if(numberOfOutputs == null){
        numberOfOutputs = 0;
    }

    var outputs = document.getElementById("outputs");

    var newOutput = document.createElement("td");
    newOutput.setAttribute("id", "output"+numberOfOutputs);
    newOutput.className = "output text-center";
    newOutput.style.paddingTop = "20px";

    newOutput.innerHTML =   "<h3 id='output-title"+ numberOfOutputs +"' contenteditable='true' onchange='loadOutputs()' style='margin-top: 0px'>" + "Output #" + (numberOfOutputs + 1) + "</h3>" +
                            "<div class='input-group'>" +
                                "<input type='text' class='form-control' aria-describedby='basic-addon1' id='outputInput" + numberOfOutputs + " ' onchange='loadOutputs()' style='width: 120px' value=" + value +" />" +
                                "<span class='input-group-addon' style='margin: 0; padding: 0; border: 0'>" +
                                    "<button class='btn btn-secondary' onclick='deleteLoss("+numberOfOutputs+")' style='background-color: #8f3236'><span class='glyphicon glyphicon-minus'></span></button>" +
                                "</div>" +
                                "<div class='input-group'>" +
                                    "<span class='input-group-addon' id='basic-addon1'>Units</span>" +
                                    "<input type='text' class='form-control' aria-describedby='basic-addon1' id='outputUnits" + numberOfOutputs + " ' onchange='loadOutputs()' style='width: 103px' value=" + units +" />" +
                            "</div>";

    outputs.appendChild(newOutput);

    var inputs = document.getElementById("inputs");

    var newSpanner = document.createElement("td");
    newSpanner.setAttribute("id", "output-spanner"+numberOfOutputs);
    newSpanner.style.width = "157px";

    inputs.appendChild(newSpanner);

    columns++;

    moveDiffrenceTable();

    numberOfOutputs++;
}

var numberOfInputs;

function addInput(){

    if(numberOfInputs == null){
        numberOfInputs = 0;
    }

    var inputs = document.getElementById("inputs");

    var newInput = document.createElement("td");
    newInput.setAttribute("id", "input"+numberOfInputs);
    newInput.className = "input text-center";
    newInput.style.paddingTop = "20px";

    newInput.innerHTML =    "<h3 id='input-title"+ numberOfInputs +"' contenteditable='true' onchange='loadInputs()' style='margin-top: 0px'>" + "Input #" + (numberOfInputs + 1) + "</h3>" +
                            "<div class='input-group'>" +
                                "<input type='text' class='form-control' aria-describedby='basic-addon1' id='inputInput" + numberOfInputs + " ' onchange='loadInputs()'  style='width: 160px -webkit-border-radius: 4px; -moz-border-radius: 4px; border-radius: 4px;' />" +
                            "</div>" +
                            "<div class='input-group'>" +
                                "<span class='input-group-addon' id='basic-addon1'>Units</span>" +
                                "<input type='text' class='form-control' aria-describedby='basic-addon1' id='inputUnits" + numberOfOutputs + " ' onchange='loadInputs()' style='width: 103px' />" +
                            "</div>";

    inputs.appendChild(newInput);

    var outputs = document.getElementById("outputs");

    var newSpanner = document.createElement("td");
    newSpanner.setAttribute("id", "input-spanner"+numberOfInputs);
    newSpanner.style.width = "157px";

    outputs.appendChild(newSpanner);

    columns++;

    moveDiffrenceTable();

    numberOfInputs++;
}

function addSavedInput(value, units){

    console.log(value);

    if(numberOfInputs == null){
        numberOfInputs = 0;
    }

    var inputs = document.getElementById("inputs");

    var newInput = document.createElement("td");
    newInput.setAttribute("id", "input"+numberOfInputs);
    newInput.className = "input text-center";
    newInput.style.paddingTop = "20px";

    newInput.innerHTML =    "<h3 id='input-title"+ numberOfInputs +"' contenteditable='true' onchange='loadInputs()' style='margin-top: 0px'>" + "Input #" + (numberOfInputs + 1) + "</h3>" +
                                "<div class='input-group'>" +
                                    "<input type='text' class='form-control' aria-describedby='basic-addon1' id='inputInput" + numberOfInputs + " ' onchange='loadInputs()'  style='width: 160px -webkit-border-radius: 4px; -moz-border-radius: 4px; border-radius: 4px;' value=" + value +" />" +
                                "</div>" +
                                "<div class='input-group'>" +
                                    "<span class='input-group-addon' id='basic-addon1'>Units</span>" +
                                    "<input type='text' class='form-control' aria-describedby='basic-addon1' id='inputUnits" + numberOfOutputs + " ' onchange='loadInputs()' style='width: 103px' value=" + units +" />" +
                            "</div>";

    inputs.appendChild(newInput);

    var outputs = document.getElementById("outputs");

    var newSpanner = document.createElement("td");
    newSpanner.setAttribute("id", "input-spanner"+numberOfInputs);
    newSpanner.style.width = "157px";

    outputs.appendChild(newSpanner);

    columns++;

    moveDiffrenceTable();

    numberOfInputs++;
}

function loadOutputs(){

    outputs = [];

    var elements = document.getElementsByClassName("output");

    for(var i = 0; i < elements.length; i++){
        outputs.push({
            name: elements[i].childNodes[0].textContent,
            value: elements[i].childNodes[1].childNodes[0].value,
            units: elements[i].childNodes[2].childNodes[1].value
        });
    }

    update();

}

function loadInputs(){

    inputs = [];

    var elements = document.getElementsByClassName("input");

    for(var i = 0; i < elements.length; i++){
        inputs.push({
            name: elements[i].childNodes[0].textContent,
            value: elements[i].childNodes[1].childNodes[0].value,
            units: elements[i].childNodes[2].childNodes[1].value
        });
    }

    update();
}

function updateDifference(){

    difference = {
        name: document.getElementById("differenceTable").childNodes[1].textContent,
        units: document.getElementById("differenceTable").childNodes[5].childNodes[3].value
    };

    update();
}

function removeElementByID(elementName) {
    document.getElementById(elementName).parentNode.removeChild(document.getElementById(elementName));
}

function removeElementsByClass(className){
    var elements = document.getElementsByClassName(className);
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }
}

function deleteLoss(lossNumber){
    removeElementByID("output"+lossNumber);
    removeElementByID("output-spanner"+lossNumber);
    loadOutputs();
    columns--;
    moveDiffrenceTable();
}

function update(){
    if(sankeyIsMade) {
        makeSankey('#sankey-display', false);
    }
}

function dnd(className){
    function handleFileSelect(evt) {

        evt.stopPropagation();
        evt.preventDefault();

        var files = evt.dataTransfer.files; // FileList object.

        // files is a FileList of File objects. List some properties.
        var output = [];
        for (var i = 0, f; f = files[i]; i++) {
            // Only process image files.
            if (!f.type.match('image.*')) {
                continue;
            }

            var reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = (function(theFile) {
                return function(e) {

                    var imageContainer = document.createElement('div');

                    imageContainer.id = 'imageContainer';
                    imageContainer.className += "imageContainer";
                    imageContainer.style.left = eventX + "px";
                    imageContainer.style.top = eventY + "px";
                    imageContainer.style.width = "100px";
                    imageContainer.style.height = "100px";
                    imageContainer.onmousedown = function(){mydragg.startMoving(imageContainer,'sankey-display',event)};
                    imageContainer.onmouseup = function(){mydragg.stopMoving('sankey-display')};

                    var image = document.createElement("img");

                    imageContainer.appendChild(image);

                    image.src = e.target.result;
                    image.id = "image";
                    image.style.width = "100%";
                    image.style.height = "100%";

                    image.ondragstart = function() { return false; };

                    document.getElementById("banner").onmouseover = function(){mydragg.stopMoving('sankey-display')};
                    document.getElementById("sankey-create").onmouseover = function(){mydragg.stopMoving('sankey-display')};

                    var resizer = document.createElement('div');
                    resizer.className = 'resizer';
                    resizer.style.backgroundColor = "#303336";
                    resizer.style.width = "10px";
                    resizer.style.height = "10px";
                    resizer.style.right = "0px";
                    resizer.style.bottom = "0px";
                    resizer.style.cursor = "se-resize";
                    resizer.style.position = "absolute";
                    resizer.style.display = "none";
                    imageContainer.appendChild(resizer);

                    imageContainer.onmouseover = function(){
                        imageContainer.addEventListener('mouseover', function init() {
                            imageContainer.removeEventListener('mouseover', init, false);
                            imageContainer.className = imageContainer.className + ' resizable';

                            resizer.style.display = null;

                            resizer.onmousedown = function(e){
                                imageContainer.onmousedown = function(){};
                                imageContainer.onmouseup = function(){};
                                initDrag(e, imageContainer)
                            };
                            resizer.onmouseup = function(){
                                imageContainer.onmousedown = function(){mydragg.startMoving(imageContainer,'sankey-display',event)};
                                imageContainer.onmouseup = function(){mydragg.stopMoving('sankey-display')};
                            };
                        }, false);
                    };

                    imageContainer.onmouseout = function(){
                        resizer.style.display = "none";
                    };

                    document.getElementById("sankey-display").appendChild(imageContainer);

                    dnd("imageContainer");

                    //document.getElementById("sankey-display").style.backgroundImage = "url('" + e.target.result + "')";

                };
            })(f);

            // Read in the image file as a data URL.
            reader.readAsDataURL(f);
        }
        document.getElementsByClassName('drop_zone').addEventListener('change', handleFileSelect, false);
    }

    function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    }

    // Setup the dnd listeners.
    var dropZone = document.getElementsByClassName(className);

    for(var i = 0; i < dropZone.length; i++) {
        dropZone[i].addEventListener('dragover', handleDragOver, false);
        dropZone[i].addEventListener('drop', handleFileSelect, false);
    }
}

function saveSankey(element){
    console.log("here");
    if(sankeyIsMade) {
        var a = document.getElementById(element);

        var saveData = {
            saveNodes: nodes,
            saveLinks: links,
            saveNodeHandles: nodeHandles
        };

        var blob = new Blob(
            [JSON.stringify(saveData)],
            {type: "application/json"}
        );
        a.download = document.getElementById("sankey-title").childNodes[0].textContent + ".json";
        a.href = window.URL.createObjectURL(blob);
    }
}

function readSingleFile(event) {
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(event.target.files[0]);

}

function onReaderLoad(event){
    console.log(event.target.result);
    var saveData = JSON.parse(event.target.result);

    nodes = saveData.saveNodes;
    links = saveData.saveLinks;
    nodeHandles = saveData.saveNodeHandles;

    nodes.forEach(function(d){
        if(d.input){
            if(d.value !== "" && d.units !== "") {
                addSavedInput(d.value, d.units);
            }
            else if(d.value !== "" && d.units === ""){
                addSavedInput(d.value, "&nbsp");
            }
            else if(d.value === "" && d.units !== ""){
                addSavedInput("&nbsp", d.value);
            }
            else{
                addSavedInput("&nbsp", "&nbsp");
            }
        }
        else if(!d.inter && !d.difference){
            if(d.value !== "" && d.units !== "") {
                addSavedOutput(d.value, d.units);
            }
            else if(d.value !== "" && d.units === ""){
                addSavedOutput(d.value, "&nbsp");
            }
            else if(d.value === "" && d.units !== ""){
                addSavedOutput("&nbsp", d.value);
            }
            else{
                addSavedOutput("&nbsp", "&nbsp");
            }
        }
    });

    loadInputs();
    loadOutputs();

    makeSankey("#sankey-display", true);

}






