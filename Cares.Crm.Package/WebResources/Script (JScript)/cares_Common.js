
//display icon and tooltio for the grid column  
function displayGridColumnTooltip(rowData, userLCID) {
    debugger;
    var str = JSON.parse(rowData);
    var coldata = "Sample of a long tooltip for the grid column.";// str.prioritycode_Value;
    var imgName = "";
    var tooltip = coldata;
    var resultarray = [imgName, tooltip];
    return resultarray;
}

var count = 0;
/**
 * This function loads the custom CSS 
 * */
function LoadCSS() {
    var tabGeneral = Xrm.Page.ui.tabs.get("tab_General"); //.
    count++;
    if (tabGeneral == undefined && count < 10) {
        console.log("Table has not been loaded, rerunning in 1 second. Count = " + count);
        setTimeout(function () {
            LoadCSS();
        }, 1000);
    } else {
        console.log("tab_General loaded and available on the form.");
        debugger;

        // var sections = tabGeneral.getSections();
        //if (sections != undefined && sections != null) {
        //    sections.forEach(function (element) {
        //        debugger;
        //        // element.css("background", "beige");
        //    });
        //}
    }

    //.css("background", "beige");

    //var path = '/WebResources/cares_/Styles/cares_CrmStyle.css';
    //var head = document.getElementsByTagName('head')[0];
    //var link = document.createElement('link');
    //link.rel = 'stylesheet';
    //link.type = 'text/css';
    //link.href = path;
    //link.media = 'all';
    //head.appendChild(link);
}
