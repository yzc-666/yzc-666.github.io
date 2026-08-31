/* AI startup tracker page. */

(function () {
  "use strict";

  var grid = document.getElementById("startup-grid");
  var projectsEl = document.getElementById("project-list");
  var emptyEl = document.getElementById("tracker-empty");
  var statsEl = document.getElementById("tracker-stats");
  var searchEl = document.getElementById("tracker-q");
  var filterBtns = document.querySelectorAll(".tracker-filters [data-country]");
  var updatedMeta = document.getElementById("updated-meta");

  if (!grid) return;

  var state = {
    country: "all",
    query: "",
    companies: [],
    projects: [],
  };

  var esc = function (value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  var countryLabel = function (code) {
    return code === "CN" ? "China" : code === "US" ? "United States" : code;
  };

  var matches = function (company) {
    if (state.country !== "all" && company.country !== state.country) return false;
    var q = state.query.trim().toLowerCase();
    if (!q) return true;
    var hay = [
      company.name,
      company.one_liner,
      (company.tags || []).join(" "),
      (company.products || [])
        .map(function (p) {
          return p.name + " " + (p.note || "");
        })
        .join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return hay.indexOf(q) !== -1;
  };

  var renderCompanies = function () {
    var rows = state.companies.filter(matches);
    grid.innerHTML = "";
    if (emptyEl) emptyEl.hidden = rows.length > 0;

    rows.forEach(function (company) {
      var li = document.createElement("li");
      li.className = "startup-card reveal is-visible";

      var products = (company.products || [])
        .map(function (p) {
          var label = esc(p.name);
          if (p.url) {
            return (
              '<a class="chip" href="' +
              esc(p.url) +
              '" rel="noopener">' +
              label +
              "</a>"
            );
          }
          return '<span class="chip chip--static">' + label + "</span>";
        })
        .join("");

      var tags = (company.tags || [])
        .slice(0, 4)
        .map(function (tag) {
          return '<span class="startup-card__tag">' + esc(tag) + "</span>";
        })
        .join("");

      var links = [];
      if (company.website) {
        links.push(
          '<a class="chip" href="' +
            esc(company.website) +
            '" rel="noopener">Site</a>'
        );
      }
      if (company.source_url) {
        links.push(
          '<a class="chip" href="' +
            esc(company.source_url) +
            '" rel="noopener">Source</a>'
        );
      }

      li.innerHTML =
        '<div class="startup-card__top">' +
        '<span class="badge ' +
        (company.country === "CN" ? "badge--magenta" : "badge--cyan") +
        '">' +
        esc(countryLabel(company.country)) +
        "</span>" +
        (company.batch
          ? '<span class="startup-card__batch">' + esc(company.batch) + "</span>"
          : "") +
        "</div>" +
        "<h3>" +
        esc(company.name) +
        "</h3>" +
        '<p class="startup-card__bio">' +
        esc(company.one_liner || "") +
        "</p>" +
        (tags ? '<p class="startup-card__tags">' + tags + "</p>" : "") +
        (products
          ? '<div class="startup-card__products">' + products + "</div>"
          : "") +
        (links.length
          ? '<div class="startup-card__links">' + links.join("") + "</div>"
          : "");

      grid.appendChild(li);
    });
  };

  var renderProjects = function () {
    if (!projectsEl) return;
    var rows = state.projects.filter(function (item) {
      if (state.country !== "all" && item.country && item.country !== state.country) {
        return false;
      }
      var q = state.query.trim().toLowerCase();
      if (!q) return true;
      return (item.name + " " + (item.summary || "")).toLowerCase().indexOf(q) !== -1;
    });

    projectsEl.innerHTML = rows
      .map(function (item) {
        var href = item.url || "#";
        return (
          '<li class="project-item">' +
          '<span class="badge ' +
          (item.country === "CN" ? "badge--magenta" : "badge--cyan") +
          '">' +
          esc(item.source || countryLabel(item.country)) +
          "</span>" +
          '<div><a class="link" href="' +
          esc(href) +
          '" rel="noopener">' +
          esc(item.name) +
          "</a>" +
          (item.summary
            ? '<p class="project-item__sum">' + esc(item.summary) + "</p>"
            : "") +
          "</div></li>"
        );
      })
      .join("");
  };

  var render = function () {
    renderCompanies();
    renderProjects();
  };

  Array.prototype.forEach.call(filterBtns, function (btn) {
    btn.addEventListener("click", function () {
      state.country = btn.getAttribute("data-country") || "all";
      Array.prototype.forEach.call(filterBtns, function (other) {
        other.classList.toggle("is-on", other === btn);
      });
      render();
    });
  });

  if (searchEl) {
    searchEl.addEventListener("input", function () {
      state.query = searchEl.value || "";
      render();
    });
  }

  fetch("data/ai-startups.json", { cache: "no-store" })
    .then(function (resp) {
      if (!resp.ok) throw new Error("tracker missing");
      return resp.json();
    })
    .then(function (data) {
      state.companies = data.companies || [];
      state.projects = data.projects || [];
      if (statsEl) {
        statsEl.hidden = false;
        var set = function (id, value) {
          var el = document.getElementById(id);
          if (el) el.textContent = String(value);
        };
        set("stat-total", (data.stats && data.stats.total) || state.companies.length);
        set("stat-cn", (data.stats && data.stats.cn) || 0);
        set("stat-us", (data.stats && data.stats.us) || 0);
        set(
          "stat-projects",
          (data.stats && data.stats.projects) || state.projects.length
        );
      }
      if (updatedMeta && data.updated_at) {
        updatedMeta.textContent = "Updated " + data.updated_at.replace("T", " ").replace("Z", " UTC");
      }
      render();
    })
    .catch(function () {
      grid.innerHTML = "";
      if (emptyEl) {
        emptyEl.hidden = false;
        emptyEl.textContent =
          "Tracker data has not been generated yet. The daily GitHub Action will fill this page.";
      }
    });
})();
