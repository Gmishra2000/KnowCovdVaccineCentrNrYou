const puppeteer = require("puppeteer");

const PDFDocument = require("./pdfkit-tables");
const fs = require("fs");



let path = require("path");

let yourLocation = process.argv[2];

let link = "https://www.cowin.gov.in/home";

let cTab;

let vaccineCenter;
(async function fn() {
    try {
        let browserOpenPromise = puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized"]
        });

        let browser = await browserOpenPromise;

        let allTabsArr = await browser.pages();

        cTab = allTabsArr[0];


        vaccineCenter = await findYourNearbyVaccineCenter(link, yourLocation);


        createPdf(vaccineCenter, yourLocation); // function to create pdf on basis of your vaccine center in your lo


        let yourAddress = path.join(yourLocation + ".json");
        fs.writeFile(yourAddress, JSON.stringify({ vaccineCenter }, null, 4), function (err) {
            if (err) throw err;
            console.log('complete');
        }
        );
        console.table(vaccineCenter);

        // await cTab.click(".mapContent .searchDiv .inputSec .seachBtn");

    }
    catch (err) {
        console.log(err);
    }
})();

async function findYourNearbyVaccineCenter(link, yourLocation) {

    await cTab.goto(link);

    await cTab.waitForSelector("#mmiMap1_search1", { visible: true });

    await cTab.type("#mmiMap1_search1", yourLocation, { delay: 1000 });

    await cTab.waitForSelector("#mmiMap1_search1_li0", { visible: true });

    await cTab.click("#mmiMap1_search1_li0");

    await cTab.waitForSelector(".searchList li h3", { visible: true });

    return cTab.evaluate(consoleFn,
        ".searchList li",
        ".searchList li h3",
        ".searchList li p",
        ".searchList li p a[href]");

}

// .searchList li
// .searchList li h3 -> Name of hospitals
// .searchList li p  -> Address of hospital
// .searchList li p a -> Direction

function consoleFn(blockSelector, hospitalNameSelector, addressSelector, directionSelector) {
    let allBlocks = document.querySelectorAll(blockSelector);
    let list = [];
    for (let i = 0; i < allBlocks.length; i++) {
        let hospitalName = allBlocks[i].querySelector(hospitalNameSelector);
        let hospitalAddress = allBlocks[i].querySelector(addressSelector);
        let hospitalDirection = allBlocks[i].querySelector(directionSelector);

        console.log(hospitalDirection[i]);

        list.push({
            HospitalName: hospitalName.innerText,
            Address: hospitalAddress.textContent,
            Direction: hospitalDirection.getAttribute('href')
        });
    }
    return list;
}


function createPdf(vaccineCenter, yourLocation) {
    let pdfDoc = new PDFDocument;
    pdfDoc.pipe(fs.createWriteStream(`${yourLocation}.pdf`));

    pdfDoc
        .image("logo.jpg", 50, 40, { width: 80 })
        .fillColor("#444444")
        .fontSize(20)
        .text(`Vaccine Centers In ${yourLocation}`, 110, 57, { align: "center" })
        .fontSize(10)

        .moveDown();


    const table = {
        headers: ["Hospital Name", "Address", "Hospital Direction"],
        rows: []
    };

    // Add the patients to the table
    for (const patient of vaccineCenter) {
        table.rows.push([patient.HospitalName, patient.Address, patient.Direction])
    }

    // Draw the table
    pdfDoc.moveDown().table(table, 10, 125, { width: 590 });
    pdfDoc.end();
}
