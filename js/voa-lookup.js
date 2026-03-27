/**
 * VOA Property Lookup — Postcode search integration for the calculator
 * Connects to the VacatAd VOA Lookup API (Cloudflare Worker)
 */

(function () {
  "use strict";

  // API endpoint — update this once the Cloudflare Worker is deployed
  var API_URL = "https://vacatad-voa-lookup.vacatad.workers.dev";

  // Minimum characters before searching
  var MIN_SEARCH_LENGTH = 3;

  // Debounce delay in ms
  var DEBOUNCE_MS = 400;

  var searchInput = document.getElementById("postcodeSearch");
  var searchBtn = document.getElementById("postcodeSearchBtn");
  var resultsContainer = document.getElementById("postcodeResults");
  var selectedBanner = document.getElementById("selectedPropertyBanner");
  var selectedAddress = document.getElementById("selectedPropertyAddress");
  var selectedDesc = document.getElementById("selectedPropertyDesc");
  var clearBtn = document.getElementById("clearSelectedProperty");

  var previousRVInput = document.getElementById("previousRV");
  var newRVInput = document.getElementById("rateableValue");
  var rhlRadios = document.querySelectorAll('input[name="isRHL"]');
  var industrialRadios = document.querySelectorAll('input[name="isIndustrial"]');
  var pubVenueRadios = document.querySelectorAll('input[name="isPubOrVenue"]');

  if (!searchInput || !resultsContainer) return;

  var debounceTimer = null;
  var currentRequest = null;
  var lastResults = null; // Store results for client-side filtering

  // Search on button click
  searchBtn.addEventListener("click", function () {
    doSearch();
  });

  // Search on Enter key
  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      doSearch();
    }
  });

  // Auto-search with debounce as user types
  searchInput.addEventListener("input", function () {
    var val = searchInput.value.trim();
    if (val.length >= MIN_SEARCH_LENGTH) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(doSearch, DEBOUNCE_MS);
    } else {
      hideResults();
    }
  });

  // Clear selection
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      clearSelection();
    });
  }

  // Close results when clicking outside
  document.addEventListener("click", function (e) {
    if (!e.target.closest("#postcode-lookup-field")) {
      hideResults();
    }
  });

  function doSearch() {
    var query = searchInput.value.trim();
    if (!query || query.length < MIN_SEARCH_LENGTH) return;

    // Normalise postcode format
    var postcode = query.toUpperCase().replace(/[^A-Z0-9\s]/g, "");

    showLoading();

    // Cancel any in-flight request
    if (currentRequest) {
      currentRequest.abort();
    }

    var controller = new AbortController();
    currentRequest = controller;

    var url = API_URL + "/api/lookup?postcode=" + encodeURIComponent(postcode);

    fetch(url, { signal: controller.signal })
      .then(function (response) {
        if (!response.ok) throw new Error("API error: " + response.status);
        return response.json();
      })
      .then(function (data) {
        currentRequest = null;
        if (data.properties && data.properties.length > 0) {
          showResults(data.properties);
        } else {
          showEmpty(postcode);
        }
      })
      .catch(function (err) {
        currentRequest = null;
        if (err.name !== "AbortError") {
          showError();
        }
      });
  }

  function showLoading() {
    resultsContainer.innerHTML =
      '<div class="calc-search-loading">Searching VOA rating list...</div>';
    resultsContainer.style.display = "block";
  }

  function showResults(properties) {
    lastResults = properties;

    // Build filter input (shown when 3+ results)
    var filterHtml = "";
    if (properties.length >= 3) {
      filterHtml =
        '<div class="calc-results-filter">' +
          '<input type="text" id="resultsFilter" class="calc-results-filter-input" ' +
            'placeholder="Filter ' + properties.length + ' results by address or type\u2026" autocomplete="off">' +
          '<span class="calc-results-count" id="resultsCount">' + properties.length + ' properties</span>' +
        '</div>';
    }

    var itemsHtml = buildResultItems(properties);

    resultsContainer.innerHTML = filterHtml + '<div id="resultsListWrap">' + itemsHtml + '</div>';
    resultsContainer.style.display = "block";

    bindResultClicks(properties);

    // Bind filter input
    var filterInput = document.getElementById("resultsFilter");
    if (filterInput) {
      filterInput.addEventListener("input", function () {
        filterResults(this.value.trim());
      });
      // Prevent the filter input from closing the dropdown
      filterInput.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
  }

  function buildResultItems(properties) {
    var html = "";
    properties.forEach(function (prop, index) {
      var rv23 = prop.rv_2023 ? "\u00A3" + Number(prop.rv_2023).toLocaleString("en-GB") : "N/A";
      var rv26 = prop.rv_2026 ? "\u00A3" + Number(prop.rv_2026).toLocaleString("en-GB") : "N/A";

      var typeBadge = "";
      if (prop.is_rhl) {
        typeBadge = '<span class="calc-search-result-type rhl">RHL</span>';
      } else if (prop.is_industrial) {
        typeBadge = '<span class="calc-search-result-type industrial">Industrial</span>';
      }

      html +=
        '<button type="button" class="calc-search-result-item" data-index="' + index + '">' +
          '<div class="calc-search-result-address">' + escapeHtml(prop.full_address) + '</div>' +
          '<div class="calc-search-result-meta">' +
            '<span>2023: <span class="calc-search-result-rv">' + rv23 + '</span></span>' +
            '<span>2026: <span class="calc-search-result-rv">' + rv26 + '</span></span>' +
            '<span>' + escapeHtml(prop.description_text) + '</span>' +
            typeBadge +
          '</div>' +
        '</button>';
    });
    return html;
  }

  function bindResultClicks(properties) {
    var buttons = resultsContainer.querySelectorAll(".calc-search-result-item");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(this.getAttribute("data-index"), 10);
        selectProperty(properties[idx]);
      });
    });
  }

  function filterResults(query) {
    if (!lastResults) return;

    var listWrap = document.getElementById("resultsListWrap");
    var countEl = document.getElementById("resultsCount");
    if (!listWrap) return;

    if (!query) {
      // Show all results
      listWrap.innerHTML = buildResultItems(lastResults);
      bindResultClicks(lastResults);
      if (countEl) countEl.textContent = lastResults.length + " properties";
      return;
    }

    var terms = query.toUpperCase().split(/\s+/);
    var filtered = [];
    var filteredIndices = [];

    lastResults.forEach(function (prop, index) {
      var haystack = [
        prop.full_address || "",
        prop.firm_name || "",
        prop.description_text || "",
        prop.description_code || ""
      ].join(" ").toUpperCase();

      var matches = terms.every(function (term) {
        return haystack.indexOf(term) !== -1;
      });

      if (matches) {
        filtered.push(prop);
        filteredIndices.push(index);
      }
    });

    if (filtered.length === 0) {
      listWrap.innerHTML =
        '<div class="calc-search-empty">No matching properties. Try a different filter.</div>';
      if (countEl) countEl.textContent = "0 of " + lastResults.length;
    } else {
      // Build items but keep original indices for correct property selection
      var html = "";
      filtered.forEach(function (prop, i) {
        var rv23 = prop.rv_2023 ? "\u00A3" + Number(prop.rv_2023).toLocaleString("en-GB") : "N/A";
        var rv26 = prop.rv_2026 ? "\u00A3" + Number(prop.rv_2026).toLocaleString("en-GB") : "N/A";

        var typeBadge = "";
        if (prop.is_rhl) {
          typeBadge = '<span class="calc-search-result-type rhl">RHL</span>';
        } else if (prop.is_industrial) {
          typeBadge = '<span class="calc-search-result-type industrial">Industrial</span>';
        }

        html +=
          '<button type="button" class="calc-search-result-item" data-index="' + filteredIndices[i] + '">' +
            '<div class="calc-search-result-address">' + escapeHtml(prop.full_address) + '</div>' +
            '<div class="calc-search-result-meta">' +
              '<span>2023: <span class="calc-search-result-rv">' + rv23 + '</span></span>' +
              '<span>2026: <span class="calc-search-result-rv">' + rv26 + '</span></span>' +
              '<span>' + escapeHtml(prop.description_text) + '</span>' +
              typeBadge +
            '</div>' +
          '</button>';
      });

      listWrap.innerHTML = html;
      bindResultClicks(lastResults);
      if (countEl) countEl.textContent = filtered.length + " of " + lastResults.length;
    }
  }

  function showEmpty(postcode) {
    resultsContainer.innerHTML =
      '<div class="calc-search-empty">' +
        'No properties found for <strong>' + escapeHtml(postcode) + '</strong>. ' +
        'Check the postcode and try again, or enter your rateable values manually below.' +
      '</div>';
    resultsContainer.style.display = "block";
  }

  function showError() {
    resultsContainer.innerHTML =
      '<div class="calc-search-empty">' +
        'Unable to search right now. Please enter your rateable values manually below.' +
      '</div>';
    resultsContainer.style.display = "block";
  }

  function hideResults() {
    resultsContainer.style.display = "none";
    resultsContainer.innerHTML = "";
  }

  function selectProperty(prop) {
    hideResults();

    // Auto-fill rateable values
    if (prop.rv_2023) {
      previousRVInput.value = prop.rv_2023;
      previousRVInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (prop.rv_2026) {
      newRVInput.value = prop.rv_2026;
    }

    // Auto-detect RHL
    if (prop.is_rhl) {
      setRadio(rhlRadios, "yes");
      // Show the pub/venue group
      var pubGroup = document.getElementById("pubVenueGroup");
      if (pubGroup) pubGroup.style.display = "";
      // Auto-detect pub/venue
      if (prop.is_pub_venue) {
        setRadio(pubVenueRadios, "yes");
      }
    } else {
      setRadio(rhlRadios, "no");
    }

    // Auto-detect industrial
    if (prop.is_industrial) {
      setRadio(industrialRadios, "yes");
    } else {
      setRadio(industrialRadios, "no");
    }

    // Show selected property banner
    if (selectedBanner) {
      selectedAddress.textContent = prop.full_address;
      selectedDesc.textContent = prop.description_text + " | " + prop.postcode;
      selectedBanner.style.display = "flex";
    }

    // Clear the search input
    searchInput.value = "";

    // Trigger the lostRelief group visibility
    var lostReliefGroup = document.getElementById("lostReliefGroup");
    if (lostReliefGroup && prop.rv_2023) {
      lostReliefGroup.style.display = "";
    }

    // Track in analytics
    if (typeof gtag === "function") {
      gtag("event", "voa_property_selected", {
        event_category: "engagement",
        event_label: "postcode_lookup",
        postcode: prop.postcode,
        has_both_rvs: prop.rv_2023 && prop.rv_2026 ? "yes" : "no",
      });
    }
  }

  function clearSelection() {
    previousRVInput.value = "";
    newRVInput.value = "";
    setRadio(rhlRadios, "no");
    setRadio(industrialRadios, "no");
    setRadio(pubVenueRadios, "no");

    var pubGroup = document.getElementById("pubVenueGroup");
    if (pubGroup) pubGroup.style.display = "none";

    var lostReliefGroup = document.getElementById("lostReliefGroup");
    if (lostReliefGroup) lostReliefGroup.style.display = "none";

    if (selectedBanner) {
      selectedBanner.style.display = "none";
    }

    searchInput.focus();
  }

  function setRadio(radios, value) {
    radios.forEach(function (r) {
      r.checked = r.value === value;
    });
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str || ""));
    return div.innerHTML;
  }
})();
