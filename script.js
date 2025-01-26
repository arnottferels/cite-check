async function fetchDataFromFile(citationStyle) {
  try {
    let filePath = "/example/ieee.txt";
    if (citationStyle === "vancouver") {
      filePath = "/example/vancouver.txt";
    }

    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error("Failed to fetch example file");
    }
    return await response.text();
  } catch (error) {
    console.error(error);
    return "";
  }
}

function setYearInputs(startYearInput, endYearInput) {
  const currentYear = new Date().getFullYear();
  startYearInput.value = currentYear - 5;
  endYearInput.value = currentYear;
  startYearInput.max = currentYear;
  endYearInput.max = currentYear;
}

function extractYearFromIeeeCitation(line) {
  const match = line.match(/\b(19\d{2}|20\d{2})\b(?=\s*,|.\s*doi:)/);
  return match ? parseInt(match[0], 10) : null;
}

function extractYearFromVancouverCitation(line) {
  const match = line.match(/\b(19\d{2}|20\d{2})\b/);
  return match ? parseInt(match[0], 10) : null;
}

function extractYearFromCitation(line, citationStyle) {
  if (citationStyle === "ieee") {
    return extractYearFromIeeeCitation(line);
  } else if (citationStyle === "vancouver") {
    return extractYearFromVancouverCitation(line);
  } else return extractYearFromIeeeCitation(line); /* fallback to IEEE */
}

function generateYearDisplay(year, startYear) {
  if (!year)
    return `<span class="italic text-gray-500">No year available</span>`;
  return year >= startYear
    ? `<span class="text-blue-500">${year}</span>`
    : `<span class="text-red-500">${year}</span>`;
}

function generateDOILink(doiIndex, line, citationStyle) {
  if (citationStyle !== "vancouver" && doiIndex !== -1) {
    const rawDOI = line
      .slice(doiIndex + 4)
      .trim()
      .replace(/[.,]*$/, "");
    if (rawDOI) {
      const doiLink = `https://doi.org/${rawDOI}`;
      return `<span class="text-yellow-500"><a href="${doiLink}" target="_blank" class="hover:underline">${rawDOI}</a></span>`;
    }
    return `<span class="text-yellow-500">DOI not found</span>`;
  } else if (citationStyle === "vancouver") {
    return `<span class="text-yellow-500">Vancouver style does not show DOI. Check below or search on Google Scholar.</span>`;
  }
  return `<span class="text-yellow-500">No DOI</span>`;
}

function generateLineResult(
  line,
  index,
  year,
  startYear,
  doiIndex,
  citationStyle
) {
  const yearDisplay = generateYearDisplay(year, startYear);
  const doiDisplay = generateDOILink(doiIndex, line, citationStyle);

  const googleScholarSearchLink = `https://scholar.google.com/scholar?q=${encodeURIComponent(
    line
  )}`;

  return `
    <li class="mb-4 flex flex-col items-start space-y-2">
      <div class="flex-1">
        <strong>Reference ${index + 1}:</strong> 
        ${yearDisplay} | <strong>DOI:</strong> ${doiDisplay}
      </div>
      <div class="flex-1 pl-6">
        <a href="${googleScholarSearchLink}" 
           target="_blank" 
           class="text-gray-500 hover:text-gray-500 hover:underline hover:decoration-gray-500 text-sm">
           ${line}
        </a>
      </div>
    </li>
  `;
}

function generateSummary(
  yearDOICount,
  totalLines,
  totalYearsWithDOI,
  citationStyle,
  startYear,
  endYear
) {
  let summary =
    "<div class='summary mb-2'><h2 class='text-xl font-semibold pt-2 border-t-2 border-gray-500'>Summary:</h2></div>";

  summary += `<ul class="space-y-2">
                <li><strong>Citation Style:</strong> <span class="text-blue-500">${
                  citationStyle === "ieee" ? "IEEE" : "Vancouver"
                }</span></li>`;
  summary += `<li><strong>Start Year:</strong> <span class="text-blue-500">${startYear}</span> | <strong>End Year:</strong> <span class="text-blue-500">${endYear}</span></li>`;

  yearDOICount.forEach((totalDOI, year) => {
    const yearClass = year < startYear ? "text-red-500" : "text-blue-500";
    summary += `<li><strong>Year:</strong> <span class="${yearClass}">${year}</span> | <strong>Total DOI:</strong> <span class="text-teal-500">${totalDOI}</span></li>`;
  });

  const percentageDOI =
    totalLines > 0
      ? ((totalYearsWithDOI / totalLines) * 100).toFixed(2)
      : "0.00";
  summary += `<hr class="my-4">
              <li><strong>Total References:</strong> <span class="text-blue-500">${totalLines}</span></li>
              <li><strong>Total Years with DOI:</strong> <span class="text-blue-500">${totalYearsWithDOI}</span></li>
              <li><strong>Percentage of References with DOI:</strong> <span class="text-green-500">${percentageDOI}%</span></li>
            </ul>`;

  summary += `<div class="mb-4 text-sm text-gray-700 italic text-end">
                <span class="text-blue-500">Blue</span>: Year in range, <span class="text-red-500">Red</span>: Year out of range, <span class="text-teal-500">Teal</span>: DOI count, <span class="text-green-500">Green</span>: DOI percentage.
              </div>
          `;

  summary += "</div>";

  return summary;
}

document.addEventListener("DOMContentLoaded", () => {
  const textArea = document.getElementById("textInput");
  const resultDiv = document.getElementById("results");
  const processButton = document.getElementById("processButton");
  const startYearInput = document.getElementById("startYear");
  const endYearInput = document.getElementById("endYear");
  const citationStyleSelect = document.getElementById("citationStyle");

  const options = [
    { value: "ieee", label: "IEEE" },
    { value: "vancouver", label: "Vancouver" },
  ];

  citationStyleSelect.innerHTML = options
    .map((option) => `<option value="${option.value}">${option.label}</option>`)
    .join("");

  citationStyleSelect.value = "ieee";

  setYearInputs(startYearInput, endYearInput);

  async function setPlaceholder() {
    const citationStyle = citationStyleSelect.value;
    const data = await fetchDataFromFile(citationStyle);

    const cleanedData = data
      .split("\n")
      .filter((line) => line.trim() !== "")
      .join("\n");

    textArea.value = cleanedData;
    textArea.placeholder = `Example format (currently supports ${
      citationStyle === "ieee" ? "IEEE" : "Vancouver"
    } style):\n\n${cleanedData}`;
  }

  setPlaceholder();

  citationStyleSelect.addEventListener("change", async () => {
    setPlaceholder();
  });

  processButton.addEventListener("click", async () => {
    const citationStyle = citationStyleSelect.value;
    const data =
      textArea.value.trim() || (await fetchDataFromFile(citationStyle));

    if (!data) {
      resultDiv.innerHTML =
        "<div class='bg-red-500 text-white p-4 rounded mb-4'>Please paste the content in the text area.</div>";
      return;
    }

    try {
      const startYear = parseInt(startYearInput.value, 10);
      const endYear = parseInt(endYearInput.value, 10);
      const lines = data.split("\n").filter((line) => line.trim() !== "");

      let totalLines = 0;
      let totalYearsWithDOI = 0;
      const yearDOICount = new Map();

      lines.forEach((line) => {
        totalLines++;

        const year = extractYearFromCitation(line, citationStyle);
        const doiIndex = line.indexOf("doi:");

        if (year) {
          yearDOICount.set(
            year,
            (yearDOICount.get(year) || 0) + (doiIndex !== -1 ? 1 : 0)
          );
        }

        if (year && doiIndex !== -1) {
          totalYearsWithDOI++;
        }
      });

      let summaryHTML = "<div class='summary mb-6'>";
      summaryHTML += generateSummary(
        yearDOICount,
        totalLines,
        totalYearsWithDOI,
        citationStyle,
        startYear,
        endYear
      );
      summaryHTML += "</div>";

      resultDiv.innerHTML = summaryHTML;

      resultDiv.innerHTML +=
        "<h2 class='text-xl font-semibold pt-2 mb-4 border-t-2 border-gray-500'>Details:</h2>";

      resultDiv.innerHTML += "<ul class='space-y-4'>";

      lines.forEach((line, index) => {
        const year = extractYearFromCitation(line, citationStyle);
        const doiIndex = line.indexOf("doi:");

        const lineResult = generateLineResult(
          line,
          index,
          year,
          startYear,
          doiIndex,
          citationStyle
        );
        resultDiv.innerHTML += lineResult;
      });

      resultDiv.innerHTML += "</ul>";
    } catch (error) {
      resultDiv.innerHTML = `<div class='bg-red-500 text-white p-4 rounded mb-4'>An error occurred: ${error.message}</div>`;
    }
  });
});
