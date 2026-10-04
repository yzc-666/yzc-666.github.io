/* AI startup tracker: renders data/ai-startups.json into startups.html. */

(function () {
  "use strict";

  var companyList = document.getElementById("companies");
  if (!companyList) return;

  var launchList = document.getElementById("launches");
  var companyEmpty = document.getElementById("companies-empty");
  var launchEmpty = document.getElementById("launches-empty");
  var companyCount = document.getElementById("company-count");
  var launchCount = document.getElementById("launch-count");
  var updated = document.getElementById("updated");
  var search = document.getElementById("q");
  var filters = document.querySelectorAll(".filters [data-country]");

  var COUNTRY = { CN: "China", US: "United States" };
  var SOURCE = { "hacker-news": "Hacker News" };

  var state = { country: "all", query: "", companies: [], launches: [] };

  var esc = function (value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  /* The data is crawled from third-party sources, so only http(s) URLs are
     ever turned into links. */
  var safeUrl = function (url) {
    url = String(url || "").trim();
    return /^https?:\/\//i.test(url) ? url : "";
  };

  var link = function (href, label, className) {
    return (
      "<a" +
      (className ? ' class="' + className + '"' : "") +
      ' href="' +
      esc(href) +
      '" target="_blank" rel="noopener">' +
      label +
      "</a>"
    );
  };

  var title = function (href, label) {
    return href
      ? link(href, label, "row-title")
      : '<span class="row-title">' + label + "</span>";
  };

  var sourceLabel = function (url) {
    var host = "";
    try {
      host = new URL(url).hostname;
    } catch (err) {
      host = "";
    }
    if (/(^|\.)ycombinator\.com$/.test(host)) return "YC profile";
    if (/(^|\.)wikipedia\.org$/.test(host)) return "Wikipedia";
    return "Source";
  };

  var matchesQuery = function (parts) {
    var q = state.query.trim().toLowerCase();
    return !q || parts.join(" ").toLowerCase().indexOf(q) !== -1;
  };

  var companyMatches = function (c) {
    if (state.country !== "all" && c.country !== state.country) return false;
    return matchesQuery([
      c.name,
      c.one_liner,
      (c.tags || []).join(" "),
      (c.products || [])
        .map(function (p) {
          return p.name + " " + (p.note || "");
        })
        .join(" "),
    ]);
  };

  var launchMatches = function (item) {
    if (state.country !== "all" && item.country && item.country !== state.country) {
      return false;
    }
    return matchesQuery([item.name, item.summary]);
  };

  var renderCompany = function (c) {
    var home = safeUrl(c.website);

    var where = [COUNTRY[c.country] || c.country];
    if (c.batch) where.push("YC " + c.batch);

    // YC entries list the company itself as its only product; skip those.
    var own = String(c.name || "").trim().toLowerCase();
    var products = (c.products || [])
      .filter(function (p) {
        return p && p.name && String(p.name).trim().toLowerCase() !== own;
      })
      .map(function (p) {
        var url = safeUrl(p.url);
        return url ? link(url, esc(p.name)) : esc(p.name);
      });

    var sub = [];
    if (products.length) {
      sub.push('<span class="row-products">' + products.join(", ") + "</span>");
    }
    if (c.tags && c.tags.length) sub.push(esc(c.tags.slice(0, 4).join(", ")));
    var source = safeUrl(c.source_url);
    if (source && source !== home) sub.push(link(source, sourceLabel(source)));

    return (
      "<li>" +
      '<div class="row-head">' +
      title(home, esc(c.name)) +
      '<span class="row-meta">' +
      esc(where.filter(Boolean).join(" · ")) +
      "</span>" +
      "</div>" +
      (c.one_liner ? '<p class="row-desc">' + esc(c.one_liner) + "</p>" : "") +
      (sub.length ? '<p class="row-sub">' + sub.join(" · ") + "</p>" : "") +
      "</li>"
    );
  };

  var renderLaunch = function (item) {
    var name = String(item.name || "");
    var showHn = /^Show HN:\s*/i.test(name);

    var meta = [
      showHn ? "Show HN" : SOURCE[item.source] || item.source || "",
      String(item.published_at || "").slice(0, 10),
    ];

    // "Hacker News discussion" is the crawler's placeholder for stories with
    // no text of their own.
    var summary =
      item.summary && item.summary !== "Hacker News discussion" ? item.summary : "";

    return (
      "<li>" +
      '<div class="row-head">' +
      title(safeUrl(item.url), esc(name.replace(/^Show HN:\s*/i, ""))) +
      "</div>" +
      (summary ? '<p class="row-desc">' + esc(summary) + "</p>" : "") +
      '<p class="row-sub">' +
      esc(meta.filter(Boolean).join(" · ")) +
      "</p>" +
      "</li>"
    );
  };

  var fill = function (listEl, emptyEl, countEl, rows, renderRow) {
    listEl.innerHTML = rows.map(renderRow).join("");
    if (countEl) countEl.textContent = String(rows.length);
    if (emptyEl) {
      emptyEl.textContent = "No matches.";
      emptyEl.hidden = rows.length > 0;
    }
  };

  var render = function () {
    fill(
      companyList,
      companyEmpty,
      companyCount,
      state.companies.filter(companyMatches),
      renderCompany
    );
    if (launchList) {
      fill(
        launchList,
        launchEmpty,
        launchCount,
        state.launches.filter(launchMatches),
        renderLaunch
      );
    }
  };

  Array.prototype.forEach.call(filters, function (btn) {
    btn.addEventListener("click", function () {
      state.country = btn.getAttribute("data-country") || "all";
      Array.prototype.forEach.call(filters, function (other) {
        other.setAttribute("aria-pressed", String(other === btn));
      });
      render();
    });
  });

  if (search) {
    search.addEventListener("input", function () {
      state.query = search.value || "";
      render();
    });
  }

  fetch("data/ai-startups.json", { cache: "no-store" })
    .then(function (resp) {
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      return resp.json();
    })
    .then(function (data) {
      state.companies = data.companies || [];
      state.launches = data.projects || [];

      var tally = { all: state.companies.length, CN: 0, US: 0 };
      state.companies.forEach(function (c) {
        if (c.country === "CN" || c.country === "US") tally[c.country] += 1;
      });
      Array.prototype.forEach.call(
        document.querySelectorAll("[data-count]"),
        function (el) {
          el.textContent = String(tally[el.getAttribute("data-count")] || 0);
        }
      );

      if (updated && data.updated_at) {
        updated.textContent =
          " · Updated " +
          String(data.updated_at).slice(0, 16).replace("T", " ") +
          " UTC";
      }

      render();
    })
    .catch(function () {
      companyList.innerHTML = "";
      if (companyEmpty) {
        companyEmpty.hidden = false;
        companyEmpty.textContent =
          "Tracker data has not been generated yet. The daily GitHub Action will fill this page.";
      }
    });
})();
