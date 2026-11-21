// Mobile menu
var burger = document.getElementById("burger");
var navLinks = document.getElementById("nav-links");
if (burger && navLinks) {
	burger.addEventListener("click", function () {
		var open = navLinks.classList.toggle("open");
		burger.classList.toggle("open", open);
		burger.setAttribute("aria-expanded", open ? "true" : "false");
	});
	navLinks.querySelectorAll("a").forEach(function (a) {
		a.addEventListener("click", function () {
			navLinks.classList.remove("open");
			burger.classList.remove("open");
			burger.setAttribute("aria-expanded", "false");
		});
	});
}

// !!! TEMPORARY translation !!!
// English translation button
(() => {
	const header = document.querySelector("header");
	if (!header) return;
	const translateButton = document.createElement("button");
	translateButton.type = "button";
	translateButton.textContent = "EN";
	translateButton.setAttribute("aria-label", "Translate page to English");
	translateButton.style.cssText =
		"cursor:pointer;margin:8px;padding:8px 12px;border:1px solid currentColor;border-radius:4px;background:transparent;color:rgba(255, 255, 255, 0.78);font:inherit";
	const buttonHost = navLinks || header.querySelector("nav") || header;
	buttonHost.appendChild(translateButton);

	const widget = document.createElement("div");
	widget.id = "google_translate_element";
	widget.style.display = "none";
	document.body.appendChild(widget);

	let widgetReady = false;
	let scriptLoading = false;
	let translationRequested = false;
	const applyEnglish = () => {
		const languageSelect = document.querySelector(".goog-te-combo");
		if (languageSelect) {
			languageSelect.value = "en";
			languageSelect.dispatchEvent(new Event("change", { bubbles: true }));
			translationRequested = false;
		} else if (translationRequested) {
			window.setTimeout(applyEnglish, 250);
		}
	};

	window.googleTranslateElementInit = function () {
		new window.google.translate.TranslateElement(
			{ pageLanguage: "cs", includedLanguages: "en", autoDisplay: false },
			"google_translate_element",
		);
		widgetReady = true;
		if (translationRequested) applyEnglish();
	};

	translateButton.addEventListener("click", function () {
		translationRequested = true;
		if (widgetReady) {
			applyEnglish();
		} else if (!scriptLoading) {
			scriptLoading = true;
			const script = document.createElement("script");
			script.src =
				"https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
			script.onerror = function () {
				scriptLoading = false;
				translationRequested = false;
			};
			document.head.appendChild(script);
		}
	});
})();

// Hero slider
(() => {
	const slides = document.querySelectorAll("#top .hero-slide");
	if (slides.length < 2) return;
	let active = 0;
	window.setInterval(() => {
		slides[active].classList.remove("is-active");
		active = (active + 1) % slides.length;
		slides[active].classList.add("is-active");
	}, 5000);
})();

// Year
var y = document.getElementById("year");
if (y) {
	y.textContent = new Date().getFullYear();
}

// Scroll reveal
const revealObserver = new IntersectionObserver(
	(entries, observer) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				entry.target.classList.add("in");
				observer.unobserve(entry.target);
			}
		});
	},
	{ threshold: 0.1 },
);
const observeReveals = (root = document) => {
	root.querySelectorAll(".reveal:not(.in)").forEach((element) => {
		revealObserver.observe(element);
	});
};
observeReveals();

// Features
fetch("./data.json")
	.then((response) => response.json())
	.then((data) => {
		const catalog = Array.isArray(data) ? data : data.catalog || [];
		let count = 0;
		catalog.forEach((item) => {
			count += 1;
			if (item) {
				const services = document.querySelector("#svc");
				services.insertAdjacentHTML(
					"beforeend",
					`
					<article class="svc reveal">
						<span class="svc-num">${count}</span>
						<h3>${item.name}</h3>
						<p>
							${item.description}
						</p>
						<ul>
							${(Array.isArray(item.features) ? item.features : [])
								.map((feature) => `<li>${feature}</li>`)
								.join("")}
						</ul>
					</article>
					`,
				);
				observeReveals(services);
			}
		});
	})
	.catch((error) => console.error(error));

// Price
fetch("./data.json")
	.then((response) => response.json())
	.then((data) => {
		const catalog = Array.isArray(data) ? data : data.catalog || [];
		catalog.forEach((item) => {
			if (item) {
				const services = document.querySelector("#services");
				services.insertAdjacentHTML(
					"beforeend",
					`
												<div class="price reveal" id="service">
													<div class="price-name">${item.name || ""}</div>
													<div class="price-amount">
														${item.price || ""} <small>Kč</small>
													</div>
													<p class="price-desc">${item.description}</p>
													<ul class="price-list">
														${(Array.isArray(item.features) ? item.features : [])
															.map((feature) => `<li>${feature}</li>`)
															.join("")}
														</ul>
													<a
														href="#kontakt"
														id="service-order"
														class="btn btn-dark"
														data-service="${item.id || ""}"
													>
														Objednat
													</a>
												</div>`,
				);
				observeReveals(services);
			}
		});
	})
	.catch((error) => console.error(error));

// Choose city

const markers = {};
const coverageCookie =
	document.cookie
		.split(";")
		.map((cookie) => cookie.trim())
		.find((cookie) => cookie.startsWith("coverage=")) || "";
let selectedCity = coverageCookie
	? decodeURIComponent(coverageCookie.slice("coverage=".length))
	: "Pardubice";

// Map

const cities = {
	Pardubice: [50.0343, 15.7812],
	Chrudim: [49.9511, 15.7956],
	"Hradec Králové": [50.2092, 15.8328],
	"Lázně Bohdaneč": [50.0756, 15.6797],
	Sezemice: [50.0665, 15.8525],
	Přelouč: [50.0399, 15.5603],
	Holice: [50.0661, 15.985],
	Dašice: [50.0284, 15.9127],
	"Vysoké Mýto": [49.9532, 16.1617],
	Choceň: [49.9997, 16.2235],
	"Ústí nad Orlicí": [49.9729, 16.3936],
	"Česká Třebová": [49.9019, 16.4479],
	Litomyšl: [49.8681, 16.3125],
	Svitavy: [49.7559, 16.4683],
	"Moravská Třebová": [49.7579, 16.6643],
	Polička: [49.7147, 16.2654],
	Skuteč: [49.8439, 15.996],
	Hlinsko: [49.7621, 15.9076],
	Třemošnice: [49.8692, 15.58],
	Nasavrky: [49.8445, 15.8046],
	Chvaletice: [50.0344, 15.4185],
	Žamberk: [50.087, 16.4674],
};

const mapElement = document.getElementById("coverage-map");

if (mapElement && typeof L !== "undefined") {
	const map = L.map("coverage-map", {
		scrollWheelZoom: true,
	});

	// Select city function
	function selectCity(name, moveMap = true) {
		if (!cities[name]) return;
		selectedCity = name;

		// Update markers
		Object.entries(markers).forEach(([city, marker]) => {
			if (city === name) {
				marker.setIcon(selectedIcon);
			} else if (city === "Pardubice") {
				marker.setIcon(centerIcon);
			} else {
				marker.setIcon(normalIcon);
			}
		});

		// Update selected city label
		document.getElementById("selected-city").textContent = selectedCity;

		// Move map
		if (moveMap) {
			map.flyTo(cities[selectedCity], 11, {
				duration: 0.8,
			});
		}

		markers[selectedCity].openPopup();
	}

	// OpenStreetMap
	L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
		attribution: "&copy; OpenStreetMap contributors",
	}).addTo(map);

	// Free delivery zone: 20 km around Pardubice
	const pardubiceCenter = [50.0343, 15.7812];

	const freeZone = L.circle(pardubiceCenter, {
		radius: 20000,
		color: "#39b879",
		weight: 2,
		opacity: 0.9,
		fillColor: "#39b879",
		fillOpacity: 0.13,
		interactive: false,
	}).addTo(map);

	const normalIcon = L.divIcon({
		className: "",
		html: '<div class="cov-marker"></div>',
		iconSize: [14, 14],
		iconAnchor: [7, 7],
	});

	const selectedIcon = L.divIcon({
		className: "",
		html: '<div class="cov-marker selected"></div>',
		iconSize: [22, 22],
		iconAnchor: [11, 11],
	});

	const centerIcon = L.divIcon({
		className: "",
		html: '<div class="cov-marker center"></div>',
		iconSize: [17, 17],
		iconAnchor: [8.5, 8.5],
	});

	// Click on city list
	const updateCityButtons = (city) => {
		if (!cities[city]) return;
		document.querySelectorAll(".cov-city").forEach((item) => {
			item.classList.toggle(
				"active",
				(item.dataset.city || item.textContent.trim()) === city,
			);
		});
		selectCity(city);
		document.cookie =
			"coverage=" +
			encodeURIComponent(city) +
			"; max-age=31536000; path=/; SameSite=Lax";
		const place = document.getElementById("place");
		if (place) place.value = city;
	};

	const updateCitySelection = () => {
		document.querySelectorAll(".cov-city").forEach((button) => {
			button.addEventListener("click", function () {
				updateCityButtons(this.dataset.city || this.textContent.trim());
			});
		});
	};

	// Add city markers
	Object.entries(cities).forEach(([name, coords]) => {
		const marker = L.marker(coords, {
			icon: name === "Pardubice" ? centerIcon : normalIcon,
		}).addTo(map);

		marker.bindPopup("<strong>" + name + "</strong>");

		marker.on("click", function () {
			selectCity(name, false);
			updateCityButtons(name);
		});

		markers[name] = marker;
	});

	// Map boundaries
	const bounds = L.latLngBounds(Object.values(cities));

	map.fitBounds(bounds, {
		padding: [35, 35],
	});

	updateCitySelection();

	// Initial selection
	if (!cities[selectedCity]) selectedCity = "Pardubice";
	document.querySelectorAll(".cov-city").forEach((button) => {
		button.classList.toggle(
			"active",
			(button.dataset.city || button.textContent.trim()) === selectedCity,
		);
	});
	selectCity(selectedCity, false);

	// Fix map rendering if loaded in a reveal section
	setTimeout(function () {
		map.invalidateSize();
	}, 300);
}

// Contact form -> mailto
var form = document.getElementById("contact-form");
var status = document.getElementById("form-status");
var serviceSelect = document.getElementById("service");
var citySelect = selectedCity;
var placeInput = document.getElementById("place");
if (citySelect && placeInput) {
	placeInput.value = citySelect;
}
const select = document.getElementById("service");

fetch("./data.json")
	.then((response) => {
		if (!response.ok) throw new Error("Failed to load data.json");
		return response.json();
	})
	.then((data) => {
		const catalog = Array.isArray(data) ? data : data.catalog || [];
		catalog.forEach(({ id, name, price }) => {
			const option = document.createElement("option");
			option.value = id;
			option.textContent = `${name} — ${price}`;
			select.appendChild(option);
		});
	})
	.catch((error) => console.error(error));

document.querySelectorAll("#service-order").forEach((button) => {
	button.addEventListener("click", () => {
		console.log("button.dataset.service: ", button.dataset.service);
		select.value = button.dataset.service;
	});
});

if (form) {
	form.addEventListener("submit", function (ev) {
		ev.preventDefault();
		var name = form.name.value.trim();
		var phone = form.phone.value.trim();
		var email = form.email.value.trim();
		var car = form.car.value.trim();
		var service = form.service.value;
		var place = form.place.value.trim();
		var message = form.message.value.trim();

		if (!name || !phone) {
			status.textContent =
				"Vyplňte prosím jméno a telefon, abychom se vám mohli ozvat.";
			status.classList.add("show");
			return;
		}

		var subject =
			"Poptávka detailing — " + name + (car ? " (" + car + ")" : "");
		var body = [
			"Jméno: " + name,
			"Telefon: " + phone,
			email ? "E-mail: " + email : "",
			car ? "Vozidlo: " + car : "",
			"Služba: " + service,
			place ? "Místo výjezdu: " + place : "",
			"",
			message ? "Zpráva:" : "",
			message,
		]
			.filter(function (l) {
				return l !== "";
			})
			.join("\n");

		var href =
			"mailto:info@leskdetail.cz?subject=" +
			encodeURIComponent(subject) +
			"&body=" +
			encodeURIComponent(body);
		window.location.href = href;

		status.textContent =
			"Otevíráme váš e-mailový klient s předvyplněnou poptávkou. Pokud se neotevřel, napište nám přímo na info@leskdetail.cz nebo zavolejte na +420 734 676 271.";
		status.classList.add("show");
	});
}
