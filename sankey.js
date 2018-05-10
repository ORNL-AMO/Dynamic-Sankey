
var svg;

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

var numberOfInputs;
var numberOfOutputs;
var totalNumberOfInputsAndOutputs = 0;
var increaseOfInputsOrOutputs = false;
var lastLength = 0;
var isNodeHandleDeleted = false;

var sequence;

var columns = 0;

var decimalPlaces = 0;

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
                eWi = parseFloat(divid.style.width),
                eHe = parseFloat(divid.style.height),
                cWi = parseFloat(document.getElementById(container).style.width),
                cHe = parseFloat(document.getElementById(container).style.height);
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

var imageCount = 0;

var fileStorage = [];
var order = [];

function handleFileSelect(evt){

    evt.stopPropagation();
    evt.preventDefault();

    var files = null;
    var isBtnInput = false;

    if(evt.dataTransfer != null) {
        files = evt.dataTransfer.files; // FileList object.
    }
    else{
        files = evt.target.files;
        isBtnInput = true;
    }

    // files is a FileList of File objects. List some properties.
    for (var i = 0, f; f = files[i]; i++) {
        fileStorage[fileStorage.length] = files[i];
        order[order.length] = imageCount;
        // Only process image files.
        if (!f.type.match('image.*')) {
            continue;
        }

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function(theFile) {
            return function(e) {

                var imageContainer = document.createElement('div');

                imageContainer.id = 'imageContainer' + imageCount;
                imageContainer.className += "imageContainer";
                if(isBtnInput){
                    imageContainer.style.left = "0px";
                    imageContainer.style.top = "0px";
                }
                else{
                    imageContainer.style.left = (eventX  - 50) + "px";
                    imageContainer.style.top = (eventY - 50) + "px";
                }

                imageContainer.style.width = "100px";
                imageContainer.style.height = "100px";
                imageContainer.onmousedown = function(){mydragg.startMoving(imageContainer,'sankey-display',event)};
                imageContainer.onmouseup = function(){mydragg.stopMoving('sankey-display')};
                imageContainer.style.zIndex = imageCount;

                var image = document.createElement("img");

                imageContainer.appendChild(image);

                image.src = e.target.result;
                image.id = "image" + imageCount;
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

                //document.getElementById("sankey-display").style.backgroundImage = "url('" + e.target.result + "')";

                // Render thumbnail.
                // var span = document.createElement('span');
                // span.id = "thumb"+imageCount;
                // span.innerHTML = ['<img class="thumb" src="', e.target.result,
                //                         '" title="', escape(theFile.name), '"/><button class="btn btn-secondary btn-pop" title="edit" onclick="removeImage(' + imageCount + ');" style="background-color: #d4161c;"><i class="glyphicon glyphicon-minus"></i></button><br>'].join('');
                // document.getElementById('list').insertBefore(span, null);

                var span = document.createElement('span');
                span.id = "thumb"+imageCount;
                span.className = "image-span";
                span.innerHTML = [  '<span class="glyphicon glyphicon-arrow-up" style="font-size: 25px; color: #ff7226; cursor: pointer;" onclick="moveUpImage(' + imageCount + ')"></span>' +
                                    '<span class="glyphicon glyphicon-arrow-down" style="font-size: 25px; padding-right: 10px; color: #ff7226; cursor: pointer;" onclick="moveDownImage(' + imageCount + ')"></span>' +
                                    '' +
                                    '<img class="thumb" src="', e.target.result,
                                        '" title="', escape(theFile.name), '"/><button class="btn btn-secondary btn-pop" title="edit" onclick="removeImage(' + imageCount + ');" style="background-color: #d4161c;"><i class="glyphicon glyphicon-minus"></i></button><br>'].join('');

                document.getElementById('list').insertBefore(span, document.getElementById('list').firstChild);


                imageCount++;
            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);
    }
    document.getElementById('sankey-display').addEventListener('change', handleFileSelect, false);

    if(isBtnInput){
        document.getElementById('selectImageInput').value = "";
    }
}


function moveUpImage(number){


    console.log("moveUpImage");

    if(document.getElementById("imageContainer" + number).nextSibling != null) {
        $("#thumb" + number).after($(document.getElementById("thumb" + number).previousSibling));

        var temp = document.getElementById("imageContainer" + number).style.zIndex;
        document.getElementById("imageContainer" + number).style.zIndex = document.getElementById("imageContainer" + number).nextSibling.style.zIndex;
        document.getElementById("imageContainer" + number).nextSibling.style.zIndex = temp;
        $("#imageContainer" + number).before($(document.getElementById("imageContainer" + number).nextSibling));
    }
    //}
}

function moveDownImage(number){

    console.log("moveDownImage");

    if(document.getElementById("imageContainer" + number).previousSibling != null) {
        $("#thumb" + number).before($(document.getElementById("thumb" + number).nextSibling));

        var temp = document.getElementById("imageContainer" + number).style.zIndex;
        document.getElementById("imageContainer" + number).style.zIndex = document.getElementById("imageContainer" + number).previousSibling.style.zIndex;
        document.getElementById("imageContainer" + number).previousSibling.style.zIndex = temp;
        $("#imageContainer" + number).after($(document.getElementById("imageContainer" + number).previousSibling));
    }
}

function removeImage(number){
    $("#image" + number).remove();
    $("#imageContainer"+number).remove();
    $("#thumb"+number).remove();
    fileStorage.splice(number, 1);
}

function removeThumb(number){
    $('#thumb'+number).remove();
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

var inputBtn = document.getElementById('selectImageInput');
inputBtn.onclick = addEventListener('change', handleFileSelect, false);
inputBtn.onchange = addEventListener('change', handleFileSelect, false);

var startX, startY, startWidth, startHeight;
var element;

function initDrag(e, elem) {
    element = elem;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseFloat(document.defaultView.getComputedStyle(element).width, 10);
    startHeight = parseFloat(document.defaultView.getComputedStyle(element).height, 10);
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

    loadSequence();

    nodes = [];

    console.log(sequence);

    //make input node
    nodes.push({
        name: sequence[0].name,
        id: "firstInput",
        value: sequence[0].value,
        displaySize: baseSize,
        width: 300,
        x: 150,
        y:0,
        input: true,
        difference: false,
        inter: false,
        top: false,
        units: sequence[0].units,
        type: sequence[0].type,
        first: true
    });

    //take all the outputs and make nodes and internodes starting at input and going to output

    //Start at 1 for the input that must always come first
    for(var i = 1; i < sequence.length; i++) {

        if(nodeHandles == null){
            if (sequence[i].type === "output") {
                //top
                //give nodes top based top position of the last nodeHandle output or input
                if (i % 2 != 0) {
                    nodes.push({
                        name: "inter #" + i,
                        id: sequence[i].id,
                        value: 0,
                        displaySize: 0,
                        width: 0,
                        x: 400 + (i - 1) * 230,
                        y: 0,
                        input: false,
                        difference: false,
                        inter: true,
                        top: true,
                        units: sequence[i].units,
                        type: sequence[i].type,
                        first: false,
                        lastY: null
                    });

                    nodes.push({
                        name: sequence[i].name,
                        id: sequence[i].id,
                        value: sequence[i].value,
                        displaySize: 0,
                        width: 0,
                        x: 600 + (i - 1) * 230,
                        y: 0,
                        input: false,
                        difference: false,
                        inter: false,
                        top: true,
                        units: sequence[i].units,
                        type: sequence[i].type,
                        first: false,
                        lastY: null
                    });
                }
                //bottom
                else {
                    nodes.push({
                        name: "inter #" + i,
                        id: sequence[i].id,
                        value: 0,
                        displaySize: 0,
                        width: 0,
                        x: 450 + (i - 1) * 230,
                        y: 0,
                        input: false,
                        difference: false,
                        inter: true,
                        top: false,
                        units: sequence[i].units,
                        type: sequence[i].type,
                        first: false,
                        lastY: null
                    });
                    nodes.push({
                        name: sequence[i].name,
                        id: sequence[i].id,
                        value: sequence[i].value,
                        displaySize: 0,
                        width: 0,
                        x: 650 + (i - 1) * 230,
                        y: 0,
                        input: false,
                        difference: false,
                        inter: false,
                        top: false,
                        units: sequence[i].units,
                        type: sequence[i].type,
                        first: false,
                        lastY: null
                    });
                }
            }
            else if(sequence[i].type === "input"){
                //top
                if (i % 2 != 0) {
                    nodes.push({
                        name: "inter #" + i,
                        id: sequence[i].id,
                        value: 0,
                        displaySize: 0,
                        width: 0,
                        x: 400 + (i - 1) * 230,
                        y: 0,
                        input: false,
                        difference: false,
                        inter: true,
                        top: true,
                        units: sequence[i].units,
                        type: sequence[i].type,
                        first: false,
                        lastY: null
                    });

                    nodes.push({
                        name: sequence[i].name,
                        id: sequence[i].id,
                        value: sequence[i].value,
                        displaySize: 0,
                        width: 0,
                        x: 200 + (i - 1) * 230,
                        y: 0,
                        input: true,
                        difference: false,
                        inter: false,
                        top: true,
                        units: sequence[i].units,
                        type: sequence[i].type,
                        first: false,
                        lastY: null
                    });
                }
                //bottom
                else {
                    nodes.push({
                        name: "inter #" + i,
                        id: sequence[i].id,
                        value: 0,
                        displaySize: 0,
                        width: 0,
                        x: 450 + (i - 1) * 230,
                        y: 0,
                        input: false,
                        difference: false,
                        inter: true,
                        top: false,
                        units: sequence[i].units,
                        type: sequence[i].type,
                        first: false,
                        lastY: null
                    });

                    nodes.push({
                        name: sequence[i].name,
                        id: sequence[i].id,
                        value: sequence[i].value,
                        displaySize: 0,
                        width: 0,
                        x: 250 + (i - 1) * 230,
                        y: 0,
                        input: true,
                        difference: false,
                        inter: false,
                        top: false,
                        units: sequence[i].units,
                        type: sequence[i].type,
                        first: false,
                        lastY: null
                    });
                }
            }
        }
        else{
            if (sequence[i].type === "output") {
                //top
                //give nodes top based top position of the last nodeHandle output or input
                if ((i*2 < nodeHandles.length && nodeHandles[i*2].top) || i*2 > nodeHandles.length+1 && !nodes[nodes.length-1].top || ( increaseOfInputsOrOutputs && i*2 == nodeHandles.length && !nodeHandles[nodeHandles.length-2].top)) {
                    nodes.push({
                        name: "inter #" + i,
                        id: sequence[i].id,
                        value: 0,
                        displaySize: 0,
                        width: 0,
                        x: 400 + (i - 1) * 230,
                        y: 0,
                        input: false,
                        difference: false,
                        inter: true,
                        top: true,
                        units: sequence[i].units,
                        type: sequence[i].type,
                        first: false,
                        lastY: null
                    });

                    nodes.push({
                        name: sequence[i].name,
                        id: sequence[i].id,
                        value: sequence[i].value,
                        displaySize: 0,
                        width: 0,
                        x: 600 + (i - 1) * 230,
                        y: 0,
                        input: false,
                        difference: false,
                        inter: false,
                        top: true,
                        units: sequence[i].units,
                        type: sequence[i].type,
                        first: false,
                        lastY: null
                    });
                }
                //bottom
                else {
                    nodes.push({
                        name: "inter #" + i,
                        id: sequence[i].id,
                        value: 0,
                        displaySize: 0,
                        width: 0,
                        x: 450 + (i - 1) * 230,
                        y: 0,
                        input: false,
                        difference: false,
                        inter: true,
                        top: false,
                        units: sequence[i].units,
                        type: sequence[i].type,
                        first: false,
                        lastY: null
                    });
                    nodes.push({
                        name: sequence[i].name,
                        id: sequence[i].id,
                        value: sequence[i].value,
                        displaySize: 0,
                        width: 0,
                        x: 650 + (i - 1) * 230,
                        y: 0,
                        input: false,
                        difference: false,
                        inter: false,
                        top: false,
                        units: sequence[i].units,
                        type: sequence[i].type,
                        first: false,
                        lastY: null
                    });
                }
            }
            else if(sequence[i].type === "input"){
                //top
                if ((i*2 < nodeHandles.length && nodeHandles[i*2].top) || i*2 > nodeHandles.length+1 && !nodes[nodes.length-1].top || ( increaseOfInputsOrOutputs && i*2 == nodeHandles.length&& !nodeHandles[nodeHandles.length-2].top)) {
                    nodes.push({
                        name: "inter #" + i,
                        id: sequence[i].id,
                        value: 0,
                        displaySize: 0,
                        width: 0,
                        x: 400 + (i - 1) * 230,
                        y: 0,
                        input: false,
                        difference: false,
                        inter: true,
                        top: true,
                        units: sequence[i].units,
                        type: sequence[i].type,
                        first: false,
                        lastY: null
                    });

                    nodes.push({
                        name: sequence[i].name,
                        id: sequence[i].id,
                        value: sequence[i].value,
                        displaySize: 0,
                        width: 0,
                        x: 200 + (i - 1) * 230,
                        y: 0,
                        input: true,
                        difference: false,
                        inter: false,
                        top: true,
                        units: sequence[i].units,
                        type: sequence[i].type,
                        first: false,
                        lastY: null
                    });
                }
                //bottom
                else {
                    nodes.push({
                        name: "inter #" + i,
                        id: sequence[i].id,
                        value: 0,
                        displaySize: 0,
                        width: 0,
                        x: 450 + (i - 1) * 230,
                        y: 0,
                        input: false,
                        difference: false,
                        inter: true,
                        top: false,
                        units: sequence[i].units,
                        type: sequence[i].type,
                        first: false,
                        lastY: null
                    });

                    nodes.push({
                        name: sequence[i].name,
                        id: sequence[i].id,
                        value: sequence[i].value,
                        displaySize: 0,
                        width: 0,
                        x: 250 + (i - 1) * 230,
                        y: 0,
                        input: true,
                        difference: false,
                        inter: false,
                        top: false,
                        units: sequence[i].units,
                        type: sequence[i].type,
                        first: false,
                        lastY: null
                    });

                }
            }
        }
    }

    if(!nodes[nodes.length-1].top) {
        nodes.push({
            name: difference.name,
            id: "difference",
            value: 0,
            displaySize: 0,
            width: 0,
            x: 400 + i *230,
            y: 0,
            input: false,
            difference: true,
            inter: false,
            top: true,
            units: difference.units,
            type: "difference",
            first: false,
            lastY: null
        });
    }
    else {
        nodes.push({
            name: difference.name,
            id: "difference",
            value: 0,
            displaySize: 0,
            width: 0,
            x: 400 + i * 230,
            y: 0,
            input: false,
            difference: true,
            inter: false,
            top: false,
            units: difference.units,
            type: "difference",
            first: false,
            lastY: null
        });
    }

    console.log(nodes);
}

function linkNodes(){
    links = [];

    if(sequence.length > 1) {

        links.push({
            source: 0,
            target: 1,
            endWidth: 0
        });

        var source = 1;
        for (var i = 1; i <= (sequence.length-1); i++) {

            //Flip for input
            if(sequence[i].type === "input") {
                links.push({
                    source: source + 1,
                    target: source,
                    endWidth: 0
                });
            }
            else{
                links.push({
                    source: source,
                    target: source + 1,
                    endWidth: 0
                });
            }

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

function updateNodeHandles(){
    if(nodeHandles.length != 0) {
        if(increaseOfInputsOrOutputs){

            //save difference node's x and y position
            var tmpX = nodeHandles[nodeHandles.length-1].x;
            var tmpY = nodeHandles[nodeHandles.length-1].y;

            var newNodeCount = 0;
            var shitfX = 0;

            if(nodeHandles.length > 4){
                if(nodes[nodeHandles.length - 5].top){
                    shitfX = nodeHandles[nodeHandles.length - 3].x - (400 + (((nodeHandles.length - 2)/2) - 1) * 230);
                }
                else{
                    shitfX = nodeHandles[nodeHandles.length - 3].x - (450 + (((nodeHandles.length - 2)/2) - 1) * 230);
                }
            }
            else{
                if(nodes[nodeHandles.length - 3].top){
                    shitfX = nodeHandles[nodeHandles.length - 3].x - (400 + (((nodeHandles.length - 2)/2) - 1) * 230);
                }
                else{
                    shitfX = nodeHandles[nodeHandles.length - 3].x - (450 + (((nodeHandles.length - 2)/2) - 1) * 230);
                }
            }


            //Remove the last difference node
            nodeHandles.pop();
            for (var x = lastLength-1; x < nodes.length; x++) {
                addNodeHandle(x);
                newNodeCount++;
                nodeHandles[x].x += shitfX;
            }

            //Add back in the difference node and apply its previous changes
            nodeHandles[nodeHandles.length-1].x = tmpX + 230 * ((newNodeCount-1)/2) + shitfX;

            //Shift difference depending on type and if it is top or bottom
            if(nodes[nodes.length-2].type === "output"){
                if(nodes[nodes.length-2].top){
                    nodeHandles[nodeHandles.length-1].y = tmpY + nodes[nodes.length-2].displaySize/2;
                }
                else{
                    nodeHandles[nodeHandles.length-1].y = tmpY - nodes[nodes.length-2].displaySize/2;
                }
            }
            else{
                if(nodes[nodes.length-2].top){
                    nodeHandles[nodeHandles.length-1].y = tmpY - nodes[nodes.length-2].displaySize/2;
                }
                else{
                    nodeHandles[nodeHandles.length-1].y = tmpY + nodes[nodes.length-2].displaySize/2;
                }
            }

        }
        else{
            for (var x = nodeHandles.length; x < nodes.length; x++) {
                addNodeHandle(x);
            }
        }

    }
    else{
        for (var x = 0; x < nodes.length; x++) {
            addNodeHandle(x);
        }
    }

    if(nodeHandles[0].lastValue == nodes[0].value){
        //Check to see if any values have changed, and if so shift the nodes
        for(var i = 0; i < nodes.length; i++){
            if(nodeHandles[i].lastValue != nodes[i].value) {
                if (nodeHandles[i].top || isNodeHandleDeleted) {
                    for (var x = i; x < nodes.length; x++) {
                        //Shift amount calculated
                        nodeHandles[x].y += calcDisplayValue(nodeHandles[i].lastValue - nodes[i].value) / 2;
                    }
                }
                else {
                    for (var x = i; x < nodes.length; x++) {
                        //Shift amount calculated
                        nodeHandles[x].y -= calcDisplayValue(nodeHandles[i].lastValue - nodes[i].value) / 2;
                    }
                }
                break;
            }
        }
    }
    else{
        //Shift nodes to new size while preserving differences previously made by the users
        for(var i = 0; i < nodes.length; i++){
            nodeHandles[i].y = nodes[i].y + (nodeHandles[i].y - nodeHandles[i].lastBaseY);
        }
    }

    //Update all changes
    for(var i = 0; i < nodes.length; i++){
        nodeHandles[i].lastValue = nodes[i].value;
        nodeHandles[i].lastDisplaySize = nodes[i].displaySize
    }

    isNodeHandleDeleted = false;

}

function addNodeHandle(i){
    nodeHandles.push({
        x: nodes[i].x,
        y: nodes[i].y,
        top: nodes[i].top,
        lastValue: nodes[i].value,
        lastDisplaySize: nodes[i].displaySize,
        id: nodes[i].id,
        lastBaseY: nodes[i].y
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

    d3.select('#sankey-svg').select('g').attr('transform', 'translate(' + d3.event.transform.x + ',' + d3.event.transform.y + ') scale(' + d3.event.transform.k + ')');
}

function recenterAndResize(){

    d3.select('#sankey-svg').call(zoom.transform, d3.zoomIdentity.scale(1));

    lastTransformX = 1;
    lastTransformY = 1;
    lastTransformK = 1;
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
        .attr("preserveAspectRatio", "xMinYMin")
        .attr("id", "sankey-svg")
        .style("position", "relative")
        .style("top", "-34px")
        .style("z-index", "0")
        .call(zoom)
        .append("g");
}

function updateSankeySVG(){
    if(svg != null){
        svg
            .call(calcSankey)
            .call(findColor);
    }
}

function calcSankey() {

    var diffrenceValue = parseFloat(nodes[0].value);

    nodes[0].y = (400 - nodes[0].displaySize / 2);

    nodes.forEach(function (d, i) {
        if (d.inter) {
            //Reset height
            if (i == 1) {
                //First interNode
                if (nodes[i + 1] != null && nodes[i + 1].type === "input") {
                    d.value = (parseFloat(nodes[i - 1].value) + parseFloat(nodes[i + 1].value));
                    d.displaySize = calcDisplayValue(d.value);
                }
                else {
                    d.value = nodes[i - 1].value - nodes[i + 1].value;
                    d.displaySize = calcDisplayValue(d.value);
                }
            }
            else {
                if (nodes[i + 1].type === "input") {
                    d.value = (parseFloat(nodes[i - 2].value) + parseFloat(nodes[i + 1].value));
                    d.displaySize = calcDisplayValue(d.value);
                }
                else {
                    d.value = (parseFloat(nodes[i - 2].value) - parseFloat(nodes[i + 1].value));
                    d.displaySize = calcDisplayValue(d.value);
                }
            }
        }
        else {
            if (!d.input) {
                if (d.difference) {
                    //This is where difference is calculated
                    diffrenceValue = diffrenceValue.toFixed(decimalPlaces);
                    d.value = diffrenceValue;
                    d.displaySize = calcDisplayValue(d.value);

                    document.getElementById("differenceTable").childNodes[3].childNodes[1].value = d.value;
                }
                else {
                    if (d.top) {
                        d.displaySize = calcDisplayValue(d.value);
                        diffrenceValue -= parseFloat(d.value);
                    }
                    else {
                        d.displaySize = calcDisplayValue(d.value);
                        diffrenceValue -= parseFloat(d.value);
                    }
                }
            }
            else {
                if (!d.first) {
                    if (d.top) {
                        d.displaySize = calcDisplayValue(d.value);
                        diffrenceValue += parseFloat(d.value);
                    }
                    else {
                        d.displaySize = calcDisplayValue(d.value);
                        diffrenceValue += parseFloat(d.value);
                    }
                }
            }
        }
    });

    nodes.forEach(function (d, i) {
        if (d.inter) {
            if (i == 1) {
                if (nodes[i + 1].type === "input") {
                    //Adjust if first ist top or bottom
                    if(nodes[i].top){
                        d.y = nodes[0].y - nodes[i + 1].displaySize / 2;
                    }
                    else{
                        d.y = nodes[0].y + nodes[i + 1].displaySize / 2;
                    }
                }
                else {
                    //Adjust if first ist top or bottom
                    if(nodes[i].top){
                        d.y = nodes[0].y + nodes[i + 1].displaySize / 2;
                    }
                    else{
                        d.y = nodes[0].y - nodes[i + 1].displaySize / 2;
                    }
                }
            }
            else {
                if (nodes[i + 1].type === "input") {
                    if (nodes[i].top) {
                        d.y = nodes[i - 2].y - nodes[i + 1].displaySize / 2;
                    }
                    else {
                        d.y = nodes[i - 2].y + nodes[i + 1].displaySize / 2;
                    }

                }
                //Output
                else {
                    if (nodes[i].top) {
                        d.y = nodes[i - 2].y + nodes[i + 1].displaySize / 2;
                    }
                    else {
                        d.y = nodes[i - 2].y - nodes[i + 1].displaySize / 2;
                    }
                }
            }
        }
        else {
            if (!d.input) {
                if (d.difference) {
                    d.y = nodes[i - 2].y;
                }
                else {
                    if (i == 2) {
                        d.y = nodes[i - 2].y - nodes[i - 1].displaySize / 2 - 50;
                    }
                    else if (d.top) {
                        d.y = nodes[i - 3].y - nodes[i - 1].displaySize / 2 - 50;
                    }
                    else {
                        d.y = nodes[i - 3].y + nodes[i - 1].displaySize / 2 + 50;
                    }
                }
            }
            else {
                if (!d.first) {
                    if (i == 2) {
                        d.y = nodes[i - 2].y - nodes[i - 1].displaySize / 2 - 50;
                    }
                    else if (d.top) {
                        d.y = nodes[i - 3].y - nodes[i - 1].displaySize / 2 - 50;
                    }
                    else {
                        d.y = nodes[i - 3].y + nodes[i - 1].displaySize / 2 + 50;
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

    if(nodes[d.source].input && nodes[d.source].first){
        if(nodes[d.target + 1].type === "input"){
            if(nodes[1].top){
                points.push([nodes[d.source].x,     nodes[0].y ]);
                points.push([nodes[d.source].x+10,  nodes[0].y ]);
                points.push([nodes[d.target].x-5,   nodes[1].y + nodes[2].displaySize/2 ]);
                points.push([nodes[d.target].x,     nodes[1].y + nodes[2].displaySize/2 ]);
            }
            else{
                points.push([nodes[d.source].x,     nodes[0].y ]);
                points.push([nodes[d.source].x+10,  nodes[0].y ]);
                points.push([nodes[d.target].x-5,   nodes[1].y - nodes[2].displaySize/2 ]);
                points.push([nodes[d.target].x,     nodes[1].y - nodes[2].displaySize/2 ]);
            }
        }
        else{
            if(nodes[1].top){
                points.push([nodes[d.source].x,     nodes[0].y ]);
                points.push([nodes[d.source].x+10,  nodes[0].y ]);
                points.push([nodes[d.target].x-5,   nodes[1].y - nodes[2].displaySize/2 ]);
                points.push([nodes[d.target].x,     nodes[1].y - nodes[2].displaySize/2 ]);
            }
            else{
                points.push([nodes[d.source].x,     nodes[0].y ]);
                points.push([nodes[d.source].x+10,  nodes[0].y ]);
                points.push([nodes[d.target].x-5,   nodes[1].y + nodes[2].displaySize/2 ]);
                points.push([nodes[d.target].x,     nodes[1].y + nodes[2].displaySize/2 ]);
            }
        }
    }
    //If it links up with an inter or difference then go strait to the interNode
    else if((nodes[d.target].inter || nodes[d.target].difference) && !nodes[d.source].input){
        if(nodes[d.target].difference){
            points.push([(nodes[d.source].x - 5),   nodes[d.source].y ]);
            points.push([(nodes[d.source].x + 5),   nodes[d.source].y ]);
            points.push([nodes[d.target].x - 5,     nodes[d.target].y ]);
            points.push([nodes[d.target].x,         nodes[d.target].y ]);
        }
        else if(nodes[d.source].type === "input") {
            points.push([(nodes[d.source].x - 5),   nodes[d.source].y ]);
            points.push([(nodes[d.source].x + 5),   nodes[d.source].y ]);
            if (nodes[d.source].top) {
                if(nodes[d.source + 2].type === "input"){
                    if(nodes[d.source + 2].top){ //If the next source node is also top, then we must accommodate
                        points.push([nodes[d.target].x - 5,     nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                        points.push([nodes[d.target].x,         nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                    }
                    else{ //next source node is bottom
                        points.push([nodes[d.target].x - 5,     nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                        points.push([nodes[d.target].x,         nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                    }
                }
                else{
                    if(nodes[d.source + 2].top){
                        points.push([nodes[d.target].x - 5,     nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                        points.push([nodes[d.target].x,         nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                    }
                    else{
                        points.push([nodes[d.target].x - 5,     nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                        points.push([nodes[d.target].x,         nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                    }
                }
            }
            else {
                if(nodes[d.source + 2].type === "input" ){
                    if(!nodes[d.source + 2].top){ //If the next source node is also bottom, then we must accommodate
                        points.push([nodes[d.target].x - 5,     nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                        points.push([nodes[d.target].x,         nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                    }
                    else{ //next source node is top
                        points.push([nodes[d.target].x - 5,     nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                        points.push([nodes[d.target].x,         nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                    }
                }
                else{
                    if(nodes[d.source + 2].top){
                        points.push([nodes[d.target].x - 5,     nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                        points.push([nodes[d.target].x,         nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                    }
                    else{
                        points.push([nodes[d.target].x - 5,     nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                        points.push([nodes[d.target].x,         nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                    }
                }
            }
        }
        else{
            points.push([(nodes[d.source].x - 5),   nodes[d.source].y ]);
            points.push([(nodes[d.source].x + 5),   nodes[d.source].y ]);
            if (nodes[d.source].top) {
                if(nodes[d.source].type === "output"){
                    if(nodes[d.source + 2].top){ //If the next source node is also top, then we must accommodate
                        if(nodes[d.source + 2].type === "output"){
                            points.push([nodes[d.target].x - 5,     nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                            points.push([nodes[d.target].x,         nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                        }
                        else{
                            points.push([nodes[d.target].x - 5,     nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                            points.push([nodes[d.target].x,         nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                        }
                    }
                    else{ //next source node is bottom
                        if(nodes[d.source + 2].type === "output"){
                            points.push([nodes[d.target].x - 5,     nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                            points.push([nodes[d.target].x,         nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                        }
                        else{
                            points.push([nodes[d.target].x - 5,     nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                            points.push([nodes[d.target].x,         nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                        }
                    }
                }
                else{
                    points.push([nodes[d.target].x - 5,     nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                    points.push([nodes[d.target].x,         nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                }
            }
            else {
                if(nodes[d.source].type === "output"){
                    if(!nodes[d.source + 2].top){ //If the next source node is also bottom, then we must accommodate
                        if(nodes[d.source + 2].type === "output"){
                            points.push([nodes[d.target].x - 5,     nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                            points.push([nodes[d.target].x,         nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                        }
                        else{
                            points.push([nodes[d.target].x - 5,     nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                            points.push([nodes[d.target].x,         nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                        }
                    }
                    else{ //next source node is top
                        if(nodes[d.source + 2].type === "output"){
                            points.push([nodes[d.target].x - 5,     nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                            points.push([nodes[d.target].x,         nodes[d.target].y - nodes[d.target + 1].displaySize/2 ]);
                        }
                        else{
                            points.push([nodes[d.target].x - 5,     nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                            points.push([nodes[d.target].x,         nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                        }
                    }
                }
                else{
                    points.push([nodes[d.target].x - 5,     nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                    points.push([nodes[d.target].x,         nodes[d.target].y + nodes[d.target + 1].displaySize/2 ]);
                }
            }
        }
    }
    else {
        //Curved links
        if(nodes[d.source].inter) {
            //Output
            if(d.target == 2){
                if(nodes[d.source].top){
                    points.push([(nodes[d.source].x - 5 ),  nodes[d.source - 1].y - nodes[d.source].displaySize/2 - (nodes[d.source - 1].y - nodes[d.source].y) - nodes[d.target].displaySize/2 ]);
                    points.push([(nodes[d.source].x + 30),  nodes[d.source - 1].y - nodes[d.source].displaySize/2 - (nodes[d.source - 1].y - nodes[d.source].y) - nodes[d.target].displaySize/2 ]);
                    points.push([(nodes[d.target].x ),      nodes[d.target].y ]);
                }
                else{
                    points.push([(nodes[d.source].x - 5 ),  nodes[d.source - 1].y + nodes[d.source].displaySize/2 + (nodes[d.source - 1].y - nodes[d.source].y) - nodes[d.target].displaySize/2 ]);
                    points.push([(nodes[d.source].x + 30),  nodes[d.source - 1].y + nodes[d.source].displaySize/2 + (nodes[d.source - 1].y - nodes[d.source].y) - nodes[d.target].displaySize/2 ]);
                    points.push([(nodes[d.target].x ),      nodes[d.target].y ]);
                }
            }
            else if (nodes[d.target].top) {
                points.push([(nodes[d.source].x - 5 ),  nodes[d.source - 2].y - nodes[d.source].displaySize/2 - (nodes[d.source - 2].y - nodes[d.source].y) - nodes[d.target].displaySize/2 ]);
                points.push([(nodes[d.source].x + 30),  nodes[d.source - 2].y - nodes[d.source].displaySize/2 - (nodes[d.source - 2].y - nodes[d.source].y) - nodes[d.target].displaySize/2 ]);
                points.push([(nodes[d.target].x ),      nodes[d.target].y ]);
            }
            else {
                points.push([(nodes[d.source].x - 5 ),  nodes[d.source - 2].y + nodes[d.source].displaySize/2 - (nodes[d.source - 2].y - nodes[d.source].y) + nodes[d.target].displaySize/2 ]);
                points.push([(nodes[d.source].x + 30),  nodes[d.source - 2].y + nodes[d.source].displaySize/2 - (nodes[d.source - 2].y - nodes[d.source].y) + nodes[d.target].displaySize/2 ]);
                points.push([(nodes[d.target].x ),      nodes[d.target].y ]);
            }
        }
        else{
            if(d.source == 2){
                if(nodes[d.source].top){
                    points.push([(nodes[d.source].x ),      nodes[d.source].y ]);
                    points.push([(nodes[d.target].x - 30),  nodes[d.target - 1].y - nodes[d.target].displaySize/2 - (nodes[d.target - 1].y - nodes[d.target].y) + nodes[d.source].displaySize/2 ]);
                    points.push([(nodes[d.target].x + 5),   nodes[d.target - 1].y - nodes[d.target].displaySize/2 - (nodes[d.target - 1].y - nodes[d.target].y) + nodes[d.source].displaySize/2 ]);
                }
                else{
                    points.push([(nodes[d.source].x ),      nodes[d.source].y ]);
                    points.push([(nodes[d.target].x - 30),  nodes[d.target - 1].y + nodes[d.target].displaySize/2 + (nodes[d.target - 1].y - nodes[d.target].y) + nodes[d.source].displaySize/2 ]);
                    points.push([(nodes[d.target].x + 5),   nodes[d.target - 1].y + nodes[d.target].displaySize/2 + (nodes[d.target - 1].y - nodes[d.target].y) + nodes[d.source].displaySize/2 ]);
                }
            }
            else if (nodes[d.target].top) {
                points.push([(nodes[d.source].x ),      nodes[d.source].y ]);
                points.push([(nodes[d.target].x - 30),  nodes[d.target - 2].y - nodes[d.target].displaySize/2 - (nodes[d.target - 2].y - nodes[d.target].y) + nodes[d.source].displaySize/2 ]);
                points.push([(nodes[d.target].x + 5),   nodes[d.target - 2].y - nodes[d.target].displaySize/2 - (nodes[d.target - 2].y - nodes[d.target].y) + nodes[d.source].displaySize/2 ]);
            }
            else {
                points.push([(nodes[d.source].x ),      nodes[d.source].y ]);
                points.push([(nodes[d.target].x - 30),  nodes[d.target - 2].y + nodes[d.target].displaySize/2 - (nodes[d.target - 2].y - nodes[d.target].y) - nodes[d.source].displaySize/2 ]);
                points.push([(nodes[d.target].x +5 ),   nodes[d.target - 2].y + nodes[d.target].displaySize/2 - (nodes[d.target - 2].y - nodes[d.target].y) - nodes[d.source].displaySize/2 ]);
            }
        }
    }
    return linkGen(points);
}

function applyNodeHandles(){
    if(increaseOfInputsOrOutputs){
        for(var i = 0; i < nodes.length; i++){
            nodeHandles[i].lastBaseY = nodes[i].y;
            nodes[i].x = nodeHandles[i].x;
            nodes[i].y = nodeHandles[i].y;
            nodes[i].top = nodeHandles[i].top;
            nodes[i].value = nodeHandles[i].lastValue;
        }
    }
    else{
        for(var i = 0; i < (nodes.length); i++){
            nodeHandles[i].lastBaseY = nodes[i].y;
            nodes[i].x = nodeHandles[i].x;
            nodes[i].y = nodeHandles[i].y;
            nodes[i].top = nodeHandles[i].top;
            nodes[i].value = nodeHandles[i].lastValue;
        }
    }
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
            return d.y;
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

        if (nodes[i].top && !nodes[i].first && !nodes[i].inter && !nodes[i].difference && (nodeHandles[i].y > (nodes[i - 1].y + nodes[i - 1].displaySize))) {
            nodeHandles[i].top = false;
            nodeHandles[i - 1].top = false;

            nodes[i].top = false;
            nodes[i - 1].top = false;

            recalculateY(i); //target
            recalculateY(i-1); //source

            nodeHandles[i].y = nodes[i].y;
            nodeHandles[i-1].y = nodes[i-1].y;

            //Shifts the rest of the sankey up to accommodate the flip change
            if(nodes[i].type === "output"){
                for(var x = (i + 1); x < nodeHandles.length; x++){
                    nodeHandles[x].y -= nodes[i].displaySize;
                }
            }
            else{
                for(var x = (i + 1); x < nodeHandles.length; x++){
                    nodeHandles[x].y += nodes[i].displaySize;
                }
            }
        }
        else if (!nodes[i].top && !nodes[i].first && !nodes[i].inter && !nodes[i].difference && (nodeHandles[i].y < nodes[i - 1].y)) {
            nodeHandles[i].top = true;
            nodeHandles[i - 1].top = true;

            nodes[i].top = true;
            nodes[i - 1].top = true;

            recalculateY(i); //target
            recalculateY(i - 1); //source

            nodeHandles[i].y = nodes[i].y;
            nodeHandles[i-1].y = nodes[i-1].y;

            //Shifts the rest of the sankey down to accommodate the flip change
            if(nodes[i].type === "output") {
                for (var x = (i + 1); x < nodeHandles.length; x++) {
                    nodeHandles[x].y += nodes[i].displaySize;
                }
            }
            else{
                for (var x = (i + 1); x < nodeHandles.length; x++) {
                    nodeHandles[x].y -= nodes[i].displaySize;
                }
            }
        }
        makeSankey('#sankey-display', false);
    }

    function dragended(d, i) {
        if (!d3.event.active) simulation.alphaTarget(0);
    }

    function recalculateY(i){
        if (nodes[i].inter) {
            if (i == 1) {
                if(nodes[i].top) {
                    if (nodes[i + 1].type === "input") {
                        nodes[i].y = nodes[0].y - nodes[i + 1].displaySize / 2;
                    }
                    else {
                        nodes[i].y = nodes[0].y + nodes[i + 1].displaySize / 2;
                    }
                }
                else{
                    if (nodes[i + 1].type === "input") {
                        nodes[i].y = nodes[0].y + nodes[i + 1].displaySize / 2;
                    }
                    else {
                        nodes[i].y = nodes[0].y - nodes[i + 1].displaySize / 2;
                    }
                }
            }
            else {
                if (nodes[i + 1].type === "input") {
                    if (nodes[i].top) {
                        nodes[i].y = nodes[i - 2].y - nodes[i + 1].displaySize / 2;
                    }
                    else {
                        nodes[i].y = nodes[i - 2].y + nodes[i + 1].displaySize / 2;
                    }
                }
                //Output
                else {
                    if (nodes[i].top) {
                        nodes[i].y = nodes[i - 2].y + nodes[i + 1].displaySize / 2;
                    }
                    else {
                        nodes[i].y = nodes[i - 2].y - nodes[i + 1].displaySize / 2;
                    }
                }
            }
        }
        else {
            if (!nodes[i].input) {
                if (nodes[i].difference) {
                    nodes[i].y = nodes[i - 2].y;
                }
                else {
                    if (i == 2) {
                        if(nodes[i].top){
                            nodes[i].y = nodes[i - 2].y - nodes[i - 1].displaySize / 2 - 50;
                        }
                        else {
                            nodes[i].y = nodes[i - 2].y + nodes[i - 1].displaySize / 2 + 50;
                        }
                    }
                    else if (nodes[i].top) {
                        nodes[i].y = nodes[i - 3].y - nodes[i - 1].displaySize / 2 - 50;
                    }
                    else {
                        nodes[i].y = nodes[i - 3].y + nodes[i - 1].displaySize / 2 + 50;
                    }
                }
            }
            else {
                if (!nodes[i].first) {
                    if (i == 2) {
                        nodes[i].y = nodes[i - 2].y - nodes[i - 1].displaySize / 2 - 50;
                    }
                    else if (nodes[i].top) {
                        nodes[i].y = nodes[i - 3].y - nodes[i - 1].displaySize / 2 - 50;
                    }
                    else {
                        nodes[i].y = nodes[i - 3].y + nodes[i - 1].displaySize / 2 + 50;
                    }
                }
            }
        }
    }
}

var linkGen;
var nodes_text;
var nodes_units;
var nodes_value;
var offset = $('#sankey-display').offset();

function makeSankey(location, isNewSankey) {
    if (inputs != null) {

        makeNodes();
        linkNodes();

        if (svg != null) {
            svg.selectAll("*").remove();
        }

        if (isNewSankey) {
            makeSankeySVG(location);
            if (nodeHandles == null) {
                nodeHandles = [];
            }
            document.getElementById("createSankeyBtn").style.display = "none";
        }
        updateSankeySVG();
        updateNodeHandles();

        //changes are applied
        applyNodeHandles();

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
                if(nodes[d.source].input && !nodes[d.source].first) {
                    return nodes[d.source].displaySize;
                }
                else{
                    if(nodes[d.source].type === "input" && nodes[d.source].first){
                        return nodes[d.source].displaySize;
                    }
                    else if(nodes[d.target].difference){
                        return nodes[d.target].displaySize;
                    }
                    else {
                        if(nodes[d.target].inter){
                            return nodes[d.source].displaySize;
                        }
                        else{
                            return nodes[d.target].displaySize;
                        }
                    }

                }
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
                if (d.first) {
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
                if (d.first || d.difference) {
                    return d.y + (d.displaySize / 2) - 80;
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
                if (d.first) {
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
                if (d.first || d.difference) {
                    return d.y + (d.displaySize / 2) + 10;
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
                if (d.first) {
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
                if (d.first || d.difference) {
                    return (d.y + (d.displaySize / 2)) - 35;
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
        else {
            d3.select("svg").style("border", "0px");
        }
    }

    increaseOfInputsOrOutputs = false;
    lastLength = nodes.length;
    sankeyIsMade = true;
}

function makeSankeyForm(){

    sequence = [];

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
        "                                   <span class='input-group-addon' id='basic-addon1'>Sublabel</span>" +
        "                                   <input type='text' class='form-control' aria-describedby='basic-addon1' onchange='updateDifference()' style='width: 80px'/>" +
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
    newOutput.className = "output text-center sequenceVariable";
    newOutput.style.paddingTop = "20px";

    newOutput.innerHTML =   "<h3 id='output-title"+ numberOfOutputs +"' contenteditable='true' onchange='loadOutputs()' style='margin-top: 0px'>" + "Output #" + (numberOfOutputs + 1) + "</h3>" +
        "<div class='input-group'>" +
        "<input type='text' class='form-control' aria-describedby='basic-addon1' id='outputInput" + numberOfOutputs + " ' onchange='loadOutputs()' style='width: 119px'/>" +
        "<span class='input-group-addon' style='margin: 0; padding: 0; border: 0'>" +
        "<button class='btn btn-secondary' onclick='deleteOutput("+numberOfOutputs+")' style='background-color: #8f3236'><span class='glyphicon glyphicon-minus'></span></button>" +
        "</div>" +
        "<div class='input-group'>" +
        "<span class='input-group-addon' id='basic-addon1'>Sublabel</span>" +
        "<input type='text' class='form-control' aria-describedby='basic-addon1' id='outputUnits" + numberOfOutputs + " ' onchange='loadOutputs()' style='width: 80px'/>" +
        "</div>";

    outputs.appendChild(newOutput);

    var inputs = document.getElementById("inputs");

    var newSpanner = document.createElement("td");
    newSpanner.setAttribute("id", "output-spanner"+numberOfOutputs);
    newSpanner.style.width = "157px";

    inputs.appendChild(newSpanner);

    columns++;

    moveDiffrenceTable();

    sequence.push({
        id: ("output"+numberOfOutputs),
        type: "output"
    });
    numberOfOutputs++;
    totalNumberOfInputsAndOutputs++;
    increaseOfInputsOrOutputs = true;
}


function addSavedOutput(value, units){

    if(numberOfOutputs == null){
        numberOfOutputs = 0;
    }

    var outputs = document.getElementById("outputs");

    var newOutput = document.createElement("td");
    newOutput.setAttribute("id", "output"+numberOfOutputs);
    newOutput.className = "output text-center sequenceVariable";
    newOutput.style.paddingTop = "20px";

    newOutput.innerHTML =   "<h3 id='output-title"+ numberOfOutputs +"' contenteditable='true' onchange='loadOutputs()' style='margin-top: 0px'>" + "Output #" + (numberOfOutputs + 1) + "</h3>" +
        "<div class='input-group'>" +
        "<input type='text' class='form-control' aria-describedby='basic-addon1' id='outputInput" + numberOfOutputs + " ' onchange='loadOutputs()' style='width: 120px' value=" + value +" />" +
        "<span class='input-group-addon' style='margin: 0; padding: 0; border: 0'>" +
        "<button class='btn btn-secondary' onclick='deleteOutput("+numberOfOutputs+")' style='background-color: #8f3236'><span class='glyphicon glyphicon-minus'></span></button>" +
        "</div>" +
        "<div class='input-group'>" +
        "<span class='input-group-addon' id='basic-addon1'>Units</span>" +
        "<input type='text' class='form-control' aria-describedby='basic-addon1' id='outputUnits" + numberOfOutputs + " ' onchange='loadOutputs()' style='width: 80px' value=" + units +" />" +
        "</div>";

    outputs.appendChild(newOutput);

    var inputs = document.getElementById("inputs");

    var newSpanner = document.createElement("td");
    newSpanner.setAttribute("id", "output-spanner"+numberOfOutputs);
    newSpanner.style.width = "157px";

    inputs.appendChild(newSpanner);

    columns++;

    moveDiffrenceTable();

    sequence.push({
        id: ("output"+numberOfOutputs),
        type: "output"
    });
    numberOfOutputs++;
    totalNumberOfInputsAndOutputs++;
}


function addInput(){

    if(numberOfInputs == null){
        numberOfInputs = 0;
    }

    var inputs = document.getElementById("inputs");

    var newInput = document.createElement("td");
    newInput.setAttribute("id", "input"+numberOfInputs);
    newInput.className = "input text-center sequenceVariable";
    newInput.style.paddingTop = "20px";

    //Don't give the first input the option to be deleted
    if(numberOfInputs == 0){
        newInput.innerHTML =    "<h3 id='input-title"+ numberOfInputs +"' contenteditable='true' onchange='loadInputs()' style='margin-top: 0px'>" + "Input #" + (numberOfInputs + 1) + "</h3>" +
            "<div class='input-group'>" +
            "<input type='text' class='form-control' aria-describedby='basic-addon1' id='inputInput" + numberOfInputs + " ' onchange='loadInputs()'  style='width: 160px -webkit-border-radius: 4px; -moz-border-radius: 4px; border-radius: 4px;' />" +
            "</div>" +
            "<div class='input-group'>" +
            "<span class='input-group-addon' id='basic-addon1'>Sublabel</span>" +
            "<input type='text' class='form-control' aria-describedby='basic-addon1' id='inputUnits" + numberOfOutputs + " ' onchange='loadInputs()' style='width: 80px' />" +
            "</div>";
    }
    else{
        newInput.innerHTML =    "<h3 id='input-title"+ numberOfInputs +"' contenteditable='true' onchange='loadInputs()' style='margin-top: 0px'>" + "Input #" + (numberOfInputs + 1) + "</h3>" +
            "<div class='input-group'>" +
            "<input type='text' class='form-control' aria-describedby='basic-addon1' id='inputInput" + numberOfInputs + " ' onchange='loadInputs()'  style='width: 119px -webkit-border-radius: 4px; -moz-border-radius: 4px; border-radius: 4px;' />" +
            "<span class='input-group-addon' style='margin: 0; padding: 0; border: 0'>" +
            "<button class='btn btn-secondary' onclick='deleteInput("+numberOfInputs+")' style='background-color: #8f3236'><span class='glyphicon glyphicon-minus'></span></button>" +
            "</div>" +
            "<div class='input-group'>" +
            "<span class='input-group-addon' id='basic-addon1'>Sublabel</span>" +
            "<input type='text' class='form-control' aria-describedby='basic-addon1' id='inputUnits" + numberOfOutputs + " ' onchange='loadInputs()' style='width: 80px' />" +
            "</div>";
    }

    inputs.appendChild(newInput);

    var outputs = document.getElementById("outputs");

    var newSpanner = document.createElement("td");
    newSpanner.setAttribute("id", "input-spanner"+numberOfInputs);
    newSpanner.style.width = "157px";

    outputs.appendChild(newSpanner);

    columns++;

    moveDiffrenceTable();

    sequence.push({
        id: ("input"+numberOfInputs),
        type: "input"
    });
    numberOfInputs++;
    totalNumberOfInputsAndOutputs++;
    increaseOfInputsOrOutputs = true;
}

function addSavedInput(value, units){

    if(numberOfInputs == null){
        numberOfInputs = 0;
    }

    var inputs = document.getElementById("inputs");

    var newInput = document.createElement("td");
    newInput.setAttribute("id", "input"+numberOfInputs);
    newInput.className = "input text-center sequenceVariable";
    newInput.style.paddingTop = "20px";

    if(numberOfInputs == 0) {
        newInput.innerHTML =    "<h3 id='input-title"+ numberOfInputs +"' contenteditable='true' onchange='loadInputs()' style='margin-top: 0px'>" + "Input #" + (numberOfInputs + 1) + "</h3>" +
            "<div class='input-group'>" +
            "<input type='text' class='form-control' aria-describedby='basic-addon1' id='inputInput" + numberOfInputs + " ' onchange='loadInputs()'  style='width: 160px -webkit-border-radius: 4px; -moz-border-radius: 4px; border-radius: 4px;' value=" + value +" />" +
            "</div>" +
            "<div class='input-group'>" +
            "<span class='input-group-addon' id='basic-addon1'>Sublabel</span>" +
            "<input type='text' class='form-control' aria-describedby='basic-addon1' id='inputUnits" + numberOfOutputs + " ' onchange='loadInputs()' style='width: 80px' value=" + units +" />" +
            "</div>";
    }
    else{
        newInput.innerHTML =    "<h3 id='input-title"+ numberOfInputs +"' contenteditable='true' onchange='loadInputs()' style='margin-top: 0px'>" + "Input #" + (numberOfInputs + 1) + "</h3>" +
            "<div class='input-group'>" +
            "<input type='text' class='form-control' aria-describedby='basic-addon1' id='inputInput" + numberOfInputs + " ' onchange='loadInputs()'  style='width: 120px -webkit-border-radius: 4px; -moz-border-radius: 4px; border-radius: 4px;' value=" + value +" />" +
            "<span class='input-group-addon' style='margin: 0; padding: 0; border: 0'>" +
            "<button class='btn btn-secondary' onclick='deleteInput("+numberOfInputs+")' style='background-color: #8f3236'><span class='glyphicon glyphicon-minus'></span></button>" +
            "</div>" +
            "<div class='input-group'>" +
            "<span class='input-group-addon' id='basic-addon1'>Sublabel</span>" +
            "<input type='text' class='form-control' aria-describedby='basic-addon1' id='inputUnits" + numberOfOutputs + " ' onchange='loadInputs()' style='width: 80px' value=" + units +" />" +
            "</div>";
    }

    inputs.appendChild(newInput);

    var outputs = document.getElementById("outputs");

    var newSpanner = document.createElement("td");
    newSpanner.setAttribute("id", "input-spanner"+numberOfInputs);
    newSpanner.style.width = "160px";

    outputs.appendChild(newSpanner);

    columns++;

    moveDiffrenceTable();

    sequence.push({
        id: ("input"+numberOfInputs),
        type: "input"
    });
    numberOfInputs++;
    totalNumberOfInputsAndOutputs++;
}

function loadSequence(){

    var inputCount = 0;
    var outputCount = 0;

    decimalPlaces = 0;

    for(var i = 0; i < sequence.length; i++){
        if(sequence[i].type === "input"){
            sequence[i] = getInput(inputCount);
            inputCount++;
        }
        else if(sequence[i].type === "output"){
            sequence[i] = getOutput(outputCount);
            outputCount++;
        }
    }
}

function getOutput(i){

    var elements = document.getElementsByClassName("output");

    var output = ({
        id: elements[i].id,
        type: "output",
        name: elements[i].childNodes[0].textContent,
        value: elements[i].childNodes[1].childNodes[0].value.replace(/,/g,""),
        units: elements[i].childNodes[2].childNodes[1].value
    });

    if(output.value === ""){
        output.value = 0;
    }

    if (output.value.toString().indexOf('.') > -1) {
        var stringDecimalPlace = output.value.toString().length - output.value.toString().indexOf('.');
        if(stringDecimalPlace > decimalPlaces){
            decimalPlaces = stringDecimalPlace;
        }
    }

    return output;
}

function getInput(i){

    var elements = document.getElementsByClassName("input");

    var input = ({
        id: elements[i].id,
        type: "input",
        name: elements[i].childNodes[0].textContent,
        value: elements[i].childNodes[1].childNodes[0].value.replace(/,/g,""),
        units: elements[i].childNodes[2].childNodes[1].value
    });

    if(input.value === ""){
        input.value = 0;
    }

    if (input.value.toString().indexOf('.') > -1) {
        var stringDecimalPlace = input.value.toString().length - input.value.toString().indexOf('.');
        if(stringDecimalPlace > decimalPlaces){
            decimalPlaces = stringDecimalPlace;
        }
    }


    return input;
}

function loadOutputs(){

    outputs = [];

    var elements = document.getElementsByClassName("output");

    for(var i = 0; i < elements.length; i++){
        outputs.push({
            name: elements[i].childNodes[0].textContent,
            value: elements[i].childNodes[1].childNodes[0].value.replace(/,/g,""),
            units: elements[i].childNodes[2].childNodes[1].value
        });
        if (outputs[i].toString().indexOf('.') > -1) {
            var stringDecimalPlace = outputs[i].value.toString().length - outputs[i].value.toString().indexOf('.');
            if(stringDecimalPlace > decimalPlaces){
                decimalPlaces = stringDecimalPlace;
            }
        }
    }

    updateDifference();
    update();

}

function loadInputs(){

    inputs = [];

    var elements = document.getElementsByClassName("input");

    for(var i = 0; i < elements.length; i++){
        inputs.push({
            name: elements[i].childNodes[0].textContent,
            value: elements[i].childNodes[1].childNodes[0].value.replace(/,/g,""),
            units: elements[i].childNodes[2].childNodes[1].value
        });
        if (inputs[i].toString().indexOf('.') > -1) {
            var stringDecimalPlace = inputs[i].value.toString().length - inputs[i].value.toString().indexOf('.');
            if(stringDecimalPlace > decimalPlaces){
                decimalPlaces = stringDecimalPlace;
            }
        }
    }

    updateDifference();
    update();
}

function updateDifference(){

    difference = {
        name: document.getElementById("differenceTable").childNodes[1].textContent,
        units: document.getElementById("differenceTable").childNodes[5].childNodes[3].value
    };

    console.log(difference);

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

function deleteOutput(outputNumber){

    columns--;
    totalNumberOfInputsAndOutputs--;
    for(var i = 0; i < sequence.length; i++){
        if( sequence[i].id === ("output"+outputNumber)){
            sequence.splice(i, 1);
            break;
        }
    }

    if(sankeyIsMade) {
        var found = false;
        var top = false;
        var outputValue = 0;

        for (var i = 0; i < nodeHandles.length; i++) {
            if (nodeHandles[i].id === ("output" + outputNumber)) {
                top = nodeHandles[i].top;
                outputValue = nodeHandles[i + 1].lastValue;
                nodeHandles.splice(i, 2);
                found = true;
            }
            if (found) {
                nodeHandles[i].x -= 230;
                if (!top) {
                    nodeHandles[i].y += calcDisplayValue(outputValue);
                }
            }
        }

        isNodeHandleDeleted = true;
    }

    removeElementByID("output"+outputNumber);
    removeElementByID("output-spanner"+outputNumber);
    loadOutputs();
    moveDiffrenceTable();
}

function deleteInput(inputNumber){

    columns--;
    totalNumberOfInputsAndOutputs--;
    for(var i = 0; i < sequence.length; i++){
        if( sequence[i].id === ("input"+inputNumber)){
            sequence.splice(i, 1);
            break;
        }
    }

    if(sankeyIsMade){
        var found = false;
        var top = false;
        var outputValue = 0;

        for(var i = 0; i < nodeHandles.length; i++){
            if( nodeHandles[i].id === ("input"+inputNumber)){
                top = nodeHandles[i].top;
                outputValue = nodeHandles[i+1].lastValue;
                nodeHandles.splice(i, 2);
                found = true;
            }
            if(found){
                nodeHandles[i].x -= 230;
                if(!top){
                    nodeHandles[i].y -= calcDisplayValue(outputValue);
                }
            }
        }

        isNodeHandleDeleted = true;
    }

    removeElementByID("input"+inputNumber);
    removeElementByID("input-spanner"+inputNumber);
    loadOutputs();
    moveDiffrenceTable();
}

function update(){
    checkForValidSankeyMake();
    if(sankeyIsMade) {
        makeSankey('#sankey-display', false);
    }
}

function saveSankey(element){
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

function checkForValidClear(){
    if((numberOfInputs != 0 && numberOfInputs != null) || (numberOfOutputs != 0 && numberOfOutputs != null)){
        $("#clearSankeyModal").modal()
    }
    else{   //Images without a sankey is a valid removal for images
        d3.selectAll(".image-span").remove();
        d3.selectAll(".imageContainer").remove();
        imageCount = 0;
    }
}

function checkForValidSankeyMake(){

    var check = true;

    if(inputs.length == 0){
        check = false;
    }

    if(inputs.length == 1 && outputs.length == 0){
        check = false;
    }

    for(var i = 0; i < inputs.length; i++){
        if(inputs[i].value == ""){
            check = false;
        }
    }

    for(var i = 0; i < outputs.length; i++){
        if(outputs[i].value == ""){
            check = false;
        }
    }

    if(check) {
        document.getElementById("createSankeyBtn").disabled = false;
    }
}

function resetSankey(){
    $("#sankey-form").remove();
    $("#sankey-display").html('');
    numberOfInputs = 0;
    numberOfOutputs = 0;
    totalNumberOfInputsAndOutputs = 0;
    columns = 0;
    nodeHandles = null;
    lastLength = 0;
    makeSankeyForm();
    document.getElementById("createSankeyBtn").style.display = null;
    sankeyIsMade = false;
    decimalPlaces = 0;
    d3.selectAll(".image-span").remove();
    d3.selectAll(".imageContainer").remove();
    imageCount = 0;
    document.getElementById("createSankeyBtn").disabled = true;
}