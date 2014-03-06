/*
* Constant variables..
*/
var padding = 270;

var currentPage = 0;
var targetSection = "";

var areas = [];
var sections = [];

var ratio = 0;
var multiplier = 1;
var cellSize = 200;

var idealPadding = 10;
var idealHeight = ( 3 * cellSize ) + ( 4 * idealPadding );
var idealWidth = ( 6 * cellSize ) + ( 7 * idealPadding );

var carouselSlideSpeed = 1000;
var interval = 100;

var resizeDelayTimer;

var kioskMode = false;
var kioskInterval = null;
var kioskCounter = 0;
var kioskStep = 1000/10;
var kioskTime = 12000;
$(document).ready(function() {
    setTimeout(function() {
        resize();
        $( window ).resize(function() {
            // Buffer up resize requests
            if (resizeDelayTimer) {
                clearTimeout(resizeDelayTimer);
            }
            resizeDelayTimer = setTimeout(function() {
                resize()
                resizeDelayTimer = null;
            },200);
        });

        $("#focusAreas").on("transitionend",function() {
            window.location.hash = areas[currentPage].id;
            $(".currentPage").removeClass("currentPage");
            $("#focusArea-"+areas[currentPage].id).addClass("currentPage");
            loadPage(window.location.hash);
        });

        $(".navigationArrowLeft").click(function(e) {
            e.preventDefault();
            pauseKiosk();
            goLeft();
        });
        $(".navigationArrowRight").click(function(e) {
            e.preventDefault();
            pauseKiosk();
            goRight();
        });


        $.getJSON ("json/data.json?"+Date.now(), function(data) {
            areas = data.areas;
            for(var i=0;i<areas.length;i++) {
                $("<div>",{class:"focusArea",id:"focusArea-"+areas[i].id}).appendTo("#focusAreas");
                $("<div>",{class:"focusArea",id:"title-"+areas[i].id}).html(areas[i].title).appendTo("#titles");
                $("<a>",{href:"#",class:"navigationBullet"}).html("&nbsp;").appendTo("#navigationBullets");
            }
            $("#navigationBullets a").each(function(index,value) { $(value).click(function(e) {e.preventDefault();pauseKiosk();goTo(index)});})
            resize();
            var pid = window.location.hash.replace("#","");
            if (pid) {
                var pidParts = pid.split("/");
                goTo(pidParts[0],pidParts[1]);
            } else {
                goTo(0);
                $("#focusArea-"+areas[0].id).addClass("currentPage");
                loadPage("#"+areas[0].id);
            }

            if (kioskMode) {
                startKiosk();
            }
            $("#interactivearea").css("opacity",1);

        });
    },500);
});

function startKiosk() {
    if (!kioskInterval) {
        $(".kioskControl img").attr("src","data/ets/icons/pause.png");
        $(".kioskTimer").show();
        kioskInterval = setInterval(function() {
            if (kioskCounter >= kioskTime) {
                console.log(sections);
                if (sections.length > 0 && Math.random() > 0.2) {
                    var s = Math.floor(Math.random()*sections.length);
                    var id = sections.splice(s,1);
                    goTo(currentPage, id[0]);
                } else {
                    goTo(Math.floor(Math.random()*areas.length));
                }
                kioskCounter = 0;
            } else {
                kioskCounter += kioskStep
            }
            updateTimer(Math.max(Math.min(100*kioskCounter/kioskTime,100)));
        },kioskStep);
    }
}

function pauseKiosk() {
    if (kioskInterval) {
        clearInterval(kioskInterval);
        kioskInterval = null;
        $(".kioskTimer").hide();
        $(".kioskControl img").attr("src","data/ets/icons/play.png");
    }
}

function updateTimer(value) {
    var radius = 38;

    var path = $(".kioskTimer path");
    var x = Math.cos((2 * Math.PI)/(100/value));
    var y = Math.sin((2 * Math.PI)/(100/value));
    var longArc = (value <= 50) ? 0 : 1;
    path.attr("d","M" + radius + "," + radius +" "+
                  "L" + radius + "," + 0 + ", "+
                  "A" + radius + "," + radius + " 0 " + longArc + ",1 " + (radius + y*radius) + "," + (radius - x*radius) + " z");
    //console.log(value,path.attr("d"));

}
function toggleKiosk() {
    if (kioskInterval) {
        pauseKiosk();
    } else {
        startKiosk();
    }
}

function resize() {
	var width = $("body").width();
	var height = $("body").height();

	// this is the ratio when dealing with the new browser size...
	ratio = idealWidth / idealHeight;

	// the width of the carousel after scaling.
	var newWidth = width - padding;
	// the scaled height using the same ratio.
	var newHeight = ( newWidth / ratio );

	// this is the multiplier of how much the height has gone changed by...
	var divPadding = 10;
	multiplier = ( newHeight - ( 2 * divPadding ) ) / ( idealHeight );
	newHeight += 45;

    // create the correct container size...
    $("#interactivearea").width ( newWidth - 20 );
    $("#interactivearea").height ( newHeight );
    var winHeight = window.innerHeight;
    var diff = winHeight - newHeight - 45;
    $("#interactivearea").css("margin-top", ( diff / 2 ) + "px" );
    var itemWidth = $("#focusAreas").width();
    $(".focusArea").width(itemWidth-10);
    $("#focusAreas").css("left",(-1*currentPage*itemWidth)+"px");
    $("#titles").css("left",(-1*currentPage*itemWidth)+"px");

    $(".navigationArrow").css("line-height",newHeight+"px");
    if (areas[currentPage]) {
        loadPage("#"+areas[currentPage].id);
    }

}


function getPageIndex(pageId) {
    for (var i=0;i<areas.length;i++) {
        if (areas[i].id === pageId) {
            return i;
        }
    }
    return 0;
}

function closeSection(callback) {
    // var div = $(".selectedItem");
    // $(".currentPage").append(div);
    // div.removeClass("selectedItem");
    // div.css({ background: "", color: "",opacity:""});
    // $(".cellTitle",div).css({"text-shadow":""});
    clearOverlay(callback);
    window.location.hash = areas[currentPage].id;
}

function goTo(page,section) {
    //console.log(page,section);
    if (typeof page === "string") {
        page = page.replace("#","");
        var pageId = page;
        page = getPageIndex(pageId);
        targetSection = section;
    } else if (section == null) {
        targetSection = "";
    } else {
        targetSection = section;
    }

    console.log(page,targetSection);
    if (page < 0) { page = areas.length-1;}
    if (page >= areas.length) { page = 0; }

    if (page == currentPage) {
        var currentSelection = $(".selectedItem").attr("id");
        if (targetSection) {
            if (currentSelection === undefined) {
                $("#"+targetSection).click();
            } else if (currentSelection != targetSection) {
                closeSection(function() {
                    $("#"+targetSection).click();
                });
            }
        } else if (currentSelection !== undefined) {
            closeSection();
        }
    } else {
        $(".overlay").remove();
        if (page >= 0 && page < areas.length) {
            currentPage = page;
            $(".cellContainer").fadeOut("200",function() {$(this).remove();});
            var itemWidth = $("#focusAreas").width();
            $("#focusAreas").css("left",(-1*currentPage*itemWidth)+"px");
            $("#titles").css("left",(-1*currentPage*itemWidth)+"px");
        }
    }
    $("#navigationBullets .navigationBullet").removeClass("current");
    $($("#navigationBullets .navigationBullet")[currentPage]).addClass("current");

}

function goLeft() {
    goTo(currentPage-1);
}
function goRight() {
    goTo(currentPage+1);
}



function loadPage(pageID) {
    var pid = pageID.replace("#","");
    $.getJSON("json/"+pid+".json?timestamp="+Date.now(), function(data) {
        sections = [];
        addCSS(data,pageID);
        var delay = addWidgets(data,pageID);
        if (targetSection) {
            setTimeout(function() {
                $("#"+targetSection).click();
            },delay+100);
        }
    });

}
function addWidgets(pageData, pageID) {
    var pid = pageID.replace("#","");
	var container = $("#focusArea-"+pid);
	container.empty();
	var pid = pageID.replace("#", "");

	var padding = idealPadding * multiplier;
	var size = cellSize * multiplier;


	var overallHeight = ( 3 * size ) + ( 4 * padding );
	var overallWidth = ( 6 * size ) + ( 7 * padding );

	var currentY = padding;
	var delay = 0;

	for ( var r = 0; r < pageData.rows.length; r++ ) {
		var currentX = padding;
		var row = pageData.rows[r];
		for ( var c = 0; c < row.content.length; c++ ) {
			var cell = row.content[c];

			var id = pid + "-r" + r + "-c" + c;

			var div = $("<div>",{class:"cellContainer",id:id,style:"width: 0px; height: 0px;"}).appendTo(container);

			var thisWidth = size * cell.w + ( ( cell.w - 1 ) * padding );
			var thisHeight = size * cell.h + ( ( cell.h - 1 ) * padding );

			var offWidth = 0;
			if ( cell.ow != null ) {
				offWidth = ( size * cell.ow ) + ( ( cell.ow ) * padding );
			}
			div.css ( {
			        "left" : ( currentX + ( thisWidth / 2 ) + offWidth ) + "px",
			        "top" : ( currentY + ( thisHeight / 2 ) ) + "px"
			} );

			currentX += ( thisWidth + padding + offWidth );

			animateOut( div, thisWidth, thisHeight, delay, cell, null );
			delay += interval;
		}
		currentY += ( size + padding );
	}

	return delay;
}

function addCSS(pageData, pageID) {
	if ( $(pageID + "-css").length == 0 && pageData.css != null ) {
		$("head").append('<link type="text/css" href="' + pageData.css + '?'+Date.now()+'" rel="stylesheet" id="' + pageID.replace("#", "") + '-css"/>');
	}
}

function animateOut( div, width, height, time, cellInfo, callback ) {
	var top = parseFloat(div.css("top").replace("px", ""));
	var left = parseFloat(div.css("left").replace("px", ""));

	if ( (cellInfo.html || cellInfo.image) && cellInfo.nobackground != null ) {
	    div.css("background", "none");
	}

	setTimeout ( function () {
        div.animate ( {
            "top" : ( top - ( height / 2 ) ) + "px",
            "left" : ( left - ( width / 2 ) ) + "px",
            "width" : width + "px",
            "height" : height + "px"
        }, {
            "complete" : function () {
                if ( cellInfo.title != null ) {
                    var d = $("<div>",{class:"cellTitle",style:"display:none; z-Index: 100; background: rgba(255,255,255,0.8);"}).html(cellInfo.title).appendTo(div);
                    d.fadeIn();
                    d.flowtype ( {
                            fontRatio : cellInfo.fontRatio || 9
                    } );
                }
                if ( cellInfo.icon != null ) {
                    if ( typeof cellInfo.icon == "string" ) {
                        div.append('<div class="cellIcon" style="display: none;"><center><img src="css/images/icons/' + cellInfo.icon + '" style="width: 70%; padding-top: 10%;"></center></div>' );
                    } else {
                        div.append('<div class="cellIcon" style="display: none;"><center><img src="css/images/icons/' + cellInfo.icon.url + '" style="padding-top: 10%;"></center></div>' );
                        var cellIcon = $(".cellIcon img", div);
                        var divHeight = div.height();
                        var percent = 60;
                        var iconHeight = divHeight * 60 / 100;
                        cellIcon.height( iconHeight );
                        if ( cellInfo.icon.style ) {
                            cellIcon.css( cellInfo.icon.style );
                        }
                    }
                    $(".cellIcon", div).fadeIn();
                }
                if ( cellInfo.html ) {
                    div.append('<div style="height: 100%;" class="overthrow containingText">' + cellInfo.html + '</div>');
                    var containingText = $(".containingText", div);
                    if ( cellInfo.columns ) {
                        containingText.addClass("column");
                        containingText.addClass("col" + cellInfo.columns );
                    }
                    if ( $(".dynamicText", div).length > 0 ) {
                        var ratio = 9;
                        if ( cellInfo.fontRatio != null ) {
                            ratio = cellInfo.fontRatio;
                        }
                        $(".dynamicText", div).flowtype( {
                            fontRatio: ratio
                        });
                    }
                }
                if (cellInfo.image) {
                    div.append('<div style="height: 100%;" class="overthrow containingText">'+
                        '<div style="height: 100%; width: 100%; overflow: hidden;">'+
                        '<img src="'+cellInfo.image+'" style="'+
                            (cellInfo.imageWidth?'width: '+cellInfo.imageWidth+';':'')+
                            (cellInfo.imageHeight?'height: '+cellInfo.imageHeight+';':'')+
                            (cellInfo.imageStyle?cellInfo.imageStyle:'')+
                            ';display: block;">'+
                        '</div>');
                }
                if ( cellInfo.url ) {
                    $.ajax ( {
                        url : cellInfo.url + "?timestamp=" + Date.now(),
                        complete : function ( data, txtStatus, jqXHR ) {
                            div.append('<div style="padding: 0px; height: 100%; position: absolute; top: 0px; bottom: 0px; width: 100%;" class="overthrow containingText">' + data.responseText + '</div>');
                            var text = $(".containingText", div );
                            text.flowtype({
                                fontRatio: ( 12 * cellInfo.w )
                            });
                        }
                    });
                }
                if ( cellInfo.onclick != null) {
                    addAction( cellInfo.onclick, div, cellInfo );
                }
                if ( callback != null ) {
                    callback();
                }
            }
        });
    }, time );
}

function addAction( mode, div, cellInfo ) {
    div.unbind ( "click" );
    if (mode != "image") {
        //console.log(mode,div.attr("id"));
        sections.push(div.attr("id"));
    }
    div.click (function (event) {
        if (event.originalEvent) {
            pauseKiosk();
        }
        if (!mode) {
            // This is an image to make clickable
            addImageContent( cellInfo, newDiv);
        } else if ( mode != "nestedtext" && mode != "image") {
            if ( $(".overlay").length == 0 ) {
                var newDiv = div.clone();
                newDiv.css({ background: "#ffffff", opacity:1});
                $(".cellTitle",newDiv).css({"text-shadow":"none"});
                $("div",newDiv).not(".cellTitle").remove();
                newDiv.click(function(event) { closeSection(); });
                var closeDiv = $('<div class="cellIcon"><center><img src="data/ets/icons/close_icon.png" style="width: 30%; max-width: 60px; margin-top: 10%;"></center></div>' );
                closeDiv.css("margin-top","10px");
                newDiv.append(closeDiv);
                newDiv.addClass("cellOverlay");
                /// get the page data...
                if ( cellInfo.data != null ) {
                    //var pid = cellInfo.data.replace(".json", "");
                    var pid = div[0].id;
                    window.location.hash = areas[currentPage].id + "/" + pid;

                    $.getJSON("data/" + cellInfo.data + "?timestamp=" + Date.now(),
                        function(pageData) {
                            if ( mode == "text" ) {
                                addTextContent( pageData , newDiv );
                            }
                            if ( mode == "nestedtext" ) {
                                addNestedTextContent( pageData , newDiv );
                            }
                            if ( mode == "photos" ) {
                                addPhotoContent( pageData , newDiv );
                            }
                            if ( mode == "demo" ) {
                                addDemoContent( pageData , newDiv );
                            }
                    });
                } else if ( cellInfo.page != null ) {
                    goTo(cellInfo.page);
                }
            } else {
                closeSection();
            }
        } else if ( mode == "nestedtext" ) {
            if ( ! div.hasClass("nestedOpen") ) {

                var newDiv = div.clone();
                newDiv.css({ background: "#ffffff", opacity:1});
                $(".cellTitle",newDiv).css({"text-shadow":"none"});
                $("div",newDiv).not(".cellTitle").remove();
                newDiv.click(function(event) {
                    div.removeClass("nestedOpen");
                    var container = $(".overlaycontent");
                    $(".nested", container).fadeOut(500, function() { $(this).remove(); });
                    newDiv.fadeOut(500, function() { $(this).remove(); });
                    $(".cellOverlay", container).fadeIn ( "slow" );
                });
                var closeDiv = $('<div class="cellIcon"><center><img src="data/ets/icons/close_icon.png" style="width: 30%; max-width: 60px; margin-top: 10%;"></center></div>' );
                closeDiv.css("margin-top","10px");
                newDiv.append(closeDiv);

                div.addClass("nestedOpen");
                $.ajax ( {
                        url : "data/" + cellInfo.data + "?timestamp=" + new Date().getTime(),
                        dataType : "json",
                        complete : function ( data, txtStatus, jqXHR ) {
                            if ( txtStatus != "error" ) {
                                var pageData = JSON.parse ( data.responseText );
                                if ( mode == "nestedtext" ) {
                                    addNestedTextContent ( pageData , newDiv );
                                }
                            } else {
                                console.log("Unable to load page");
                            }
                        }
                } );
            } else {
                console.log("Do we ever hit this?");

            }
        } else if (mode == "image") {
            addImageContent( cellInfo, newDiv);
        }
    });
}

function addTextContent ( pageData, div ) {
	addOverlay();

	var padding = idealPadding * multiplier;
	var size = cellSize * multiplier;

	var currentY = padding;

	var delay = 0;

	var container = $(".overlaycontent");

	container.append( div );

	for ( var s = 0; s < pageData.sections.length; s++ ) {
		var currentX = padding;

		var cell = pageData.sections[s];

		var id = div[0].id + "-section-" + s;
		var html = "<div class=\"cellOverlay\" id=\"" + id + "\" style=\"width: 0px; height: 0px;\"></div>";
		container.append(html);

		var thisWidth = size * cell.w + ( ( cell.w - 1 ) * padding );
		var thisHeight = size * cell.h + ( ( cell.h - 1 ) * padding );

		var offWidth = 0;
		if ( cell.ow != null ) {
			offWidth = ( size * cell.ow ) + ( ( cell.ow ) * padding );
		}

		var offHeight = 0;
		if ( cell.oh != null ) {
			offHeight = ( size * cell.oh ) + ( ( cell.oh ) * padding );
		}

		var cellDiv = $("#" + id );
		cellDiv.css ( {
		        "left" : ( currentX + ( thisWidth / 2 ) + offWidth ) + "px",
		        "top" : ( currentY + ( thisHeight / 2 ) + offHeight ) + "px"
		} );

		if ( cell.w == 6 && cell.h == 3 ) {
			animateOut( cellDiv, thisWidth, thisHeight, delay, cell, function () {
			        // full height / width so need to add close icon etc...

			        var photoContainer = $(".cellOverlay", container);
			        photoContainer.empty();

			        photoContainer.append( "<div class=\"close\" style=\"position: absolute; top: 10px; right: 10px; width: 20px; height: 20px; background: black; border-radius: 30px;\">"
			            + "<img style=\"position: absolute; top: 3px; left: 3px;\" src=\"css/images/cross.png\">"
			            + "</div>");
			        $(".close", photoContainer).click ( function () {
			                if ( div != null ) {
			                    $(".currentPage").append ( div );
			                    div.css({ background: "", color: "",opacity:""});
			                    div.removeClass("selectedItem");
			                }
			                clearOverlay();
			        } );

			        if ( div != null ) {
			            // add the icon too!
			            photoContainer.append ( "<div class=\"cellContainer\" style=\"position: absolute; top: 0px; left: 0px;\">" + div.html() + "</div>" );
			            var cellContainer = $(".cellContainer", photoContainer);
			            cellContainer.width ( div.width() );
			            cellContainer.height ( div.height() );

			            var pWidth = photoContainer.width();
			            var pHeight = photoContainer.height();

			            photoContainer.append ( "<div class=\"paragraphText overthrow\" style=\"position: absolute; border: 1px solid #c0c0c0; border-radius: 10px;\"></div>" );
			            var paragraphText = $(".paragraphText", photoContainer);
			            paragraphText.css ( {
			                    "top" : "30px",
			                    "height" : ( pHeight - 60 ) + "px",
			                    "right" : "30px",
			                    "width" : ( ( pWidth - div.width() ) - 60  ) + "px"
						} );
					}
					if ( cell.html ) {
					    paragraphText.html ( "<div style=\"padding: 3px;\">" + cell.html + "</div>" );
					}
					if ( cell.url ) {
					    $.ajax ( {
					            url : cell.url + "?timestamp=" + new Date().getTime(),
					            complete : function ( data, txtStatus, jqXHR ) {
					                paragraphText.html ( data );
					            }
					    });
					}

			} );
		} else {
			animateOut ( cellDiv, thisWidth, thisHeight, delay, cell, null );
		}


		delay += interval;
	}
}

function addOverlay( id ) {
	$(".currentPage").append("<div style=\"position: absolute; top: 0px; bottom: 0px; left: 0px; right: 0px; border-radius: 10px; \" class=\"overlay\">"
	    + "<div style=\"width: 100%; height: 100%; background: rgba(0,0,0,0.9)\"></div>"
	    + "<div class=\"overlaycontent\" style=\"position: absolute; top: 0px;\"></div>"
	    + "</div>");
}

function clearOverlay( callback ) {
	$(".overlay").fadeOut("slow", function () {
        $(".overlay").remove();
        if ( callback != null ) {
            callback();
        }
	});
}


function addNestedTextContent ( pageData, div ) {
	// addOverlay (); // already overlay there...

	var padding = idealPadding * multiplier;
	var size = cellSize * multiplier;
	var currentY = padding;
	var delay = 0;


	var container = $(".overlaycontent");

	$(".cellOverlay", container).css("display", "none"); // hide the current ones...
	// got to remove previous sections in the overlay first...
	//container.append ( div ); // the one clicked on is already in the overlay..
	div.css("display", ""); // show this again..
	container.append( div );

	for ( var s = 0; s < pageData.sections.length; s++ ) {
		var currentX = padding;

		var cell = pageData.sections[s];

		var id = div[0].id + "-nestedsection-" + s;
		var html = "<div class=\"cellOverlay nested\" id=\"" + id + "\" style=\"width: 0px; height: 0px;\"></div>";
		container.append(html);

		var thisWidth = size * cell.w + ( ( cell.w - 1 ) * padding );
		var thisHeight = size * cell.h + ( ( cell.h - 1 ) * padding );

		var offWidth = 0;
		if ( cell.ow != null ) {
			offWidth = ( size * cell.ow ) + ( ( cell.ow ) * padding );
		}

		var offHeight = 0;
		if ( cell.oh != null ) {
			offHeight = ( size * cell.oh ) + ( ( cell.oh ) * padding );
		}

		var cellDiv = $("#" + id );
		cellDiv.css ( {
		        "left" : ( currentX + ( thisWidth / 2 ) + offWidth ) + "px",
		        "top" : ( currentY + ( thisHeight / 2 ) + offHeight ) + "px"
		} );

		animateOut ( cellDiv, thisWidth, thisHeight, delay, cell, null );

		delay += interval;
	}
}

function addDemoContent ( pageData, div ) {
	addOverlay ();

	var padding = idealPadding * multiplier;
	var size = cellSize * multiplier;

	var currentY = padding;

	var delay = 0;

	var container = $(".overlaycontent");

	container.append ( div );

	var sections = [
		{
			"w" : 5,
			"h" : 3
		},
		{
			"w" : 1,
			"h" : 1,
			"ow" : 5
		},
		{
			"w" : 1,
			"h" : 1,
			"ow" : 5,
			"oh" : 1
		},
		{
			"w" : 1,
			"h" : 1,
			"ow" : 5,
			"oh" : 2
		}
	]

	for ( var s = 0; s < sections.length; s++ ) {
		var currentX = padding;

		var cell = sections[s];

		var id = div[0].id + "-section-" + s;
		var html = "<div class=\"cellOverlay\" id=\"" + id + "\" style=\"width: 0px; height: 0px;\"></div>";
		container.append(html);

		var thisWidth = size * cell.w + ( ( cell.w - 1 ) * padding );
		var thisHeight = size * cell.h + ( ( cell.h - 1 ) * padding );

		var offWidth = 0;
		if ( cell.ow != null ) {
			offWidth = ( size * cell.ow ) + ( ( cell.ow ) * padding );
		}

		var offHeight = 0;
		if ( cell.oh != null ) {
			offHeight = ( size * cell.oh ) + ( ( cell.oh ) * padding );
		}

		var cellDiv = $("#" + id );
		cellDiv.css ( {
		        "left" : ( currentX + ( thisWidth / 2 ) + offWidth ) + "px",
		        "top" : ( currentY + ( thisHeight / 2 ) + offHeight ) + "px"
		} );

		if ( s == 1 ) {
			animateOut ( cellDiv, thisWidth, thisHeight, delay, cell, function () {
			        $($(".cellOverlay")[1]).html ( div.html() );
			        $($(".cellOverlay")[1]).css("background", "#7E4599" );
			        $($(".cellOverlay")[1]).css("opacity", "");

			        $($(".cellOverlay")[1]).click ( function () {
			                // click to close..
			                $(".currentPage").append ( div );
			                div.css({ background: "", color: "",opacity:""});
			                $(".cellTitle",div).css({"text-shadow":""});
			                clearOverlay();
			        } );

			        $($(".cellOverlay")[3]).html ( "<div class=\"cellTitle\">Run Demo</div>"
			            + "<div class=\"cellIcon\"><center><img src=\"css/images/play.png\" style=\"width: 75px;  padding-top: 10%;\"></center>"
						+ "</div>"
						);
					$($(".cellOverlay")[3]).css("background", "#5F9B70" );

					$($(".cellOverlay")[3]).click ( function () {
					        // open the window for the demo..
					        $(".currentPage").append ( div );
                            div.css({ background: "", color: "",opacity:""});
                            $(".cellTitle",div).css({"text-shadow":""});
					        clearOverlay( function () {
                                openDemo ( pageData.url );
					        } );
					} );
			} );
		} else if ( s == 0 ) {
			animateOut ( cellDiv, thisWidth, thisHeight, delay, cell, function () {
			        $($(".cellOverlay")[0]).html ( "<div style=\"padding: 3px;\">" + pageData.description + "</div>");
			} );
		} else {
			animateOut ( cellDiv, thisWidth, thisHeight, delay, cell, null );
		}

		delay += interval;
	}

}
function addImageContent( cellInfo, div) {

    $("body").append("<div style=\"position: absolute; top: 20px; bottom: 85px; left: 20px; right: 20px; border-radius: 10px; z-Index: 300; \" class=\"overlay image-overlay\">"
        + "<div style=\"text-align: center; width: 100%; height: 100%; -webkit-box-shadow: 7px 7px 5px 0px rgba(50, 50, 50, 0.75); -moz-box-shadow: 7px 7px 5px 0px rgba(50, 50, 50, 0.75); box-shadow: 7px 7px 5px 0px rgba(50, 50, 50, 0.75); background: white;\">"
        + "<div class=\"close\" style=\"position: absolute; top: -10px; right: -10px; width: 20px; height: 20px; background: red; border-radius: 30px;\">"
        + "<img style=\"position: absolute; top: 3px; left: 3px;\" src=\"css/images/cross.png\">"
        + "</div>"
        + '<div style="width: 100%; height: 100%; background: no-repeat center url(\''+cellInfo.image+'\'); background-size: contain;"></div>'
        + "</div>"
        + "</div>");

    $(".image-overlay").click ( function () {
        $(".image-overlay").fadeOut("slow", function () {
            $(".image-overlay").remove();
        });
    } );
}

function addPhotoContent ( pageData, div ) {
	addOverlay ();

	var padding = idealPadding * multiplier;
	var size = cellSize * multiplier;

	var currentY = padding;

	var delay = 0;

	var container = $(".overlaycontent");
	container.append ( div );

	var currentX = padding;

	var cell = {
		"w" : 6,
		"h" : 3
	}

	var id = div[0].id + "-photos";
	var html = "<div class=\"cellOverlay\" id=\"" + id + "\" style=\"width: 0px; height: 0px;\"></div>";
	container.append(html);

	var thisWidth = size * cell.w + ( ( cell.w - 1 ) * padding );
	var thisHeight = size * cell.h + ( ( cell.h - 1 ) * padding );

	var offWidth = 0;
	if ( cell.ow != null ) {
		offWidth = ( size * cell.ow ) + ( ( cell.ow ) * padding );
	}

	var offHeight = 0;
	if ( cell.oh != null ) {
		offHeight = ( size * cell.oh ) + ( ( cell.oh ) * padding );
	}

	var cellDiv = $("#" + id );
	cellDiv.css ( {
	        "left" : ( currentX + ( thisWidth / 2 ) + offWidth ) + "px",
	        "top" : ( currentY + ( thisHeight / 2 ) + offHeight ) + "px"
	} );

	animateOut ( cellDiv, thisWidth, thisHeight, delay, cell, function () {
	        var photoContainer = $(".cellOverlay", container);
	        photoContainer.append ( "<div class=\"close\" style=\"position: absolute; top: 10px; right: 10px; width: 20px; height: 20px; background: black; border-radius: 30px;\">"
	            + "<img style=\"position: absolute; top: 3px; left: 3px;\" src=\"css/images/cross.png\">"
	            + "</div>");

	        $(".close", photoContainer).click ( function () {
	                $(".currentPage").append(div);
                    div.css({ background: "", color: "",opacity:""});
                    $(".cellTitle",div).css({"text-shadow":""});
	                clearOverlay();
	        } );

	        // add the icon too!
	        photoContainer.append ( "<div class=\"cellContainer\" style=\"position: absolute; top: 0px; left: 0px;\">" + div.html() + "</div>" );
	        var cellContainer = $(".cellContainer", photoContainer);
	        cellContainer.width ( div.width() );
	        cellContainer.height ( div.height() );


	        var pWidth = photoContainer.width();
	        var pHeight = photoContainer.height();

	        var thumbnailHeight = 40;

	        // container for the selected image...
	        photoContainer.append ( "<div class=\"selectedPhoto\" style=\"position: absolute; border: 1px solid #c0c0c0; border-radius: 10px;\"></div>" );
	        var selectedPhoto = $(".selectedPhoto", photoContainer);
	        selectedPhoto.css ( {
	                "top" : "30px",
	                "height" : ( pHeight - 60 ) + "px",
	                "right" : "30px",
	                "width" : ( ( pWidth / 3 ) * 2 ) + "px",
	                "overflow" : "hidden"
			} );

			photoContainer.append ( "<div class=\"selectedPhotoDesc\" style=\"position: absolute; \"></div>" );
			var selectedPhotoDesc = $(".selectedPhotoDesc", photoContainer);
			selectedPhotoDesc.css ( {
			        "top" : ( pHeight - 27 ) + "px",
			        "height" : "20px",
			        "font-size" : "10px",
			        "font-weight" : "bold",
			        "right" : "30px",
			        "width" : ( ( pWidth / 3 ) * 2 ) + "px",
			        "overflow" : "hidden"
			} );

			// description of the photo gallery...
			photoContainer.append ( "<div class=\"galleryDesc\" style=\"position: absolute;\"></div>" );

			//var galleryDesc = $(".galleryDesc", photoContainer);
			//var top = ( div.height() + 30 );
			//galleryDesc.css ( {
			//        "top" : top + "px",
			//        "height" : ( selectedPhoto.height() + 30 - top ) + "px",
			//        "left" : "30px",
			//        "width" : ( ( pWidth / 3 ) - 90 ) + "px",
			//        			        	                "border": "1px solid red"
            //
			//} );
			//if ( pageData.description != "" ) {
			//    galleryDesc.html ( "<div style=\"font-size: 12px\">" + pageData.description + "</div>" );
			//}

			// photo gallery thumbnails...
			photoContainer.append ( "<div class=\"thumbnails\" style=\"position: absolute;\"></div>" );
			var thumbnails = $(".thumbnails", photoContainer);
			var thumbnailBoxWidth = ( pWidth / 3 - 90);
			var thumbnailWidth = (thumbnailBoxWidth / 3)-10;

			thumbnails.css ( {
			        "bottom" : "30px",
			        "top" : cellContainer.height(),
			        "left" : "30px",
			        "width" : thumbnailBoxWidth+"px"
			} );
			for ( var i = 0; i < pageData.photos.length; i++ ) {
			    var photo = pageData.photos[i];
			    thumbnails.append ( "<div class=\"thumbnail\" data-index=\""+i+"\" style=\"vertical-align: middle; border:3px solid #efefef; border-radius: 5px; margin: 2px; width:"+thumbnailWidth+"px; height:"+thumbnailWidth+"px;\"><img src=\"data/" + photo.url + "\" "
					+ " title=\"" + photo.title + " : " + photo.description + "\" "
					+ " style=\"display: block; vertical-align: middle;  width: 100%; height: auto;\"></div>");

				if ( i == 0 ) {
				    selectedPhoto.append ( "<div style=\"padding: 3px; height: 97%; overflow: hidden;\">"
				        + "<img id=\"selectedPhoto\" src=\"data/" + photo.url + "\" style=\"width: 100%\">"
						+ "</div>"
						);
					selectedPhotoDesc.html ( photo.title + " : " + photo.description );
				}
			}
			$(".thumbnail").click ( function () {
			        var photo = pageData.photos[parseInt($(this).attr("data-index"))];
			        $("#selectedPhoto").attr("src","data/"+photo.url);
					selectedPhotoDesc.html( photo.title + " : " + photo.description);
			} );
 	} );
}

function openTweets () {
    addOverlay();

	var padding = idealPadding * multiplier;
	var size = cellSize * multiplier;

	var currentY = padding;

	var delay = 0;

	var container = $(".overlaycontent");

	var currentX = padding;

	var cell = {
		"w" : 4,
		"h" : 3,
		"ow" : 2
	}

	var id = "ets-tweets";
	var html = "<div class=\"cellOverlay\" id=\"" + id + "\" style=\"width: 0px; height: 0px;\"></div>";
	container.append(html);

	var thisWidth = size * cell.w + ( ( cell.w - 1 ) * padding );
	var thisHeight = size * cell.h + ( ( cell.h - 1 ) * padding );

	var offWidth = 0;
	if ( cell.ow != null ) {
		offWidth = ( size * cell.ow ) + ( ( cell.ow ) * padding );
	}

	var offHeight = 0;
	if ( cell.oh != null ) {
		offHeight = ( size * cell.oh ) + ( ( cell.oh ) * padding );
	}

	var cellDiv = $("#" + id );
	cellDiv.css ( {
	        "left" : ( currentX + ( thisWidth / 2 ) + offWidth ) + "px",
	        "top" : ( currentY + ( thisHeight / 2 ) + offHeight ) + "px"
	} );

	animateOut ( cellDiv, thisWidth, thisHeight, delay, cell, function () {
	        var photoContainer = $(".cellOverlay", container);
	        photoContainer.append ( "<div class=\"close\" style=\"position: absolute; top: 10px; right: 10px; width: 20px; height: 20px; background: black; border-radius: 30px;\">"
	            + "<img style=\"position: absolute; top: 3px; left: 3px;\" src=\"css/images/cross.png\">"
	            + "</div>");
	        $(".close", photoContainer).click ( function () {
	                clearOverlay();
	        } );




	        var pWidth = photoContainer.width();
	        var pHeight = photoContainer.height();

	        // container for the selected image...
	        photoContainer.append ( "<div class=\"selectedPhoto\" style=\"position: absolute; border: 1px solid #c0c0c0; border-radius: 10px;\">"
				+ "<div style=\"padding: 10px; text-align: center;\">"
				+ "<a class=\"twitter-timeline\" width=\"" + ( pWidth - 120 ) + "\" height=\"" + ( pHeight - 80 ) + "\" href=\"https://twitter.com/ibmets\" data-widget-id=\"512945062179659776\">"
				+ "Tweets by @ibmets</a>"
				+ "<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document,'script','twitter-wjs');<\/script>"
				+ "</div>"
				+ "</div>" );
			var selectedPhoto = $(".selectedPhoto", photoContainer);
			selectedPhoto.css ( {
			        "top" : "30px",
			        "height" : ( pHeight - 60 ) + "px",
			        "right" : "30px",
			        "width" : ( pWidth - 60 ) + "px",
			        "overflow-y" : "hidden"
			} );
	} );
}

function openDemo ( url ) {
	$("body").append("<div style=\"position: absolute; top: 20px; bottom: 85px; left: 20px; right: 20px; border-radius: 10px; z-Index: 300; \" class=\"overlay demo-overlay\">"
	    + "<div style=\"width: 100%; height: 100%; -webkit-box-shadow: 7px 7px 5px 0px rgba(50, 50, 50, 0.75); -moz-box-shadow: 7px 7px 5px 0px rgba(50, 50, 50, 0.75); box-shadow: 7px 7px 5px 0px rgba(50, 50, 50, 0.75); background: white;\">"
	    + "<div class=\"close\" style=\"position: absolute; top: -10px; right: -10px; width: 20px; height: 20px; background: red; border-radius: 30px;\">"
	    + "<img style=\"position: absolute; top: 3px; left: 3px;\" src=\"css/images/cross.png\">"
	    + "</div>"
	    + "<iframe src=\"" + url + "\" style=\"height: 100%; width: 100%;\"></iframe>"
	    + "</div>"
	    + "</div>");

	$(".demo-overlay .close").click ( function () {
        $(".demo-overlay").fadeOut("slow", function () {
            $(".demo-overlay").remove();
        });
	} );
}
