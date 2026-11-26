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

// ========================================
// DATA + SERVICE PRICE CALCULATOR
// ========================================

let catalog = [];
let carTypes = [];

const selectedServices = new Map();

const carTypeSelect = document.getElementById("carType");
const carTypeFormSelect = document.getElementById("carTypeForm");
const serviceSelect = document.getElementById("service");
// Multi-select services
const serviceCheckboxes = document.getElementById("service-checkboxes");
const serviceDropdown = document.getElementById("service-dropdown");
const serviceDropdownTrigger = document.getElementById(
	"service-dropdown-trigger",
);
const serviceDropdownLabel = document.getElementById("service-dropdown-label");

// Synchronize vehicle selectors
function syncCarTypeOptions() {
	if (!carTypeSelect || !carTypeFormSelect) return;

	const selectedValue = carTypeSelect.value;

	carTypeFormSelect.replaceChildren(
		...Array.from(carTypeSelect.options, (option) => option.cloneNode(true)),
	);

	carTypeFormSelect.value = selectedValue;
}

const formatPrice = (price) =>
	!price
		? '<a href="#ceny">Vyberte si svou první službu</a>'
		: `${price.toLocaleString("cs-CZ")} Kč`;

const formatStartingPrice = (price) =>
	!price
		? '<a href="#ceny">Vyberte si svou první službu</a>'
		: `od ${price.toLocaleString("cs-CZ")} Kč`;

// Round final prices to the nearest 100 CZK
function roundPrice(price) {
	return Math.round(price / 100) * 100;
}
function getCarMultiplier() {
	const option = carTypeSelect?.selectedOptions[0];

	if (!option || !option.value) return 1;

	const multiplier = Number(option.dataset.multiplier);

	return Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
}

// Calculate the price of each selected service
function getPricedServices() {
	const multiplier = getCarMultiplier();

	return Array.from(selectedServices.values()).map((service) => ({
		...service,
		finalPrice: roundPrice(service.price * multiplier),
	}));
}

// Update all prices and the order summary
function updateTotalPrice() {
	const pricedServices = getPricedServices();

	const total = pricedServices.reduce(
		(sum, service) => sum + service.finalPrice,
		0,
	);

	const totalElement = document.getElementById("total-price");

	if (totalElement) {
		totalElement.innerHTML = formatPrice(total);
	}

	const selectedElement = document.getElementById("selected-services");

	if (selectedElement) {
		selectedElement.innerHTML = pricedServices.length
			? pricedServices
					.map(
						(service) => `
                <div>
                    ${service.name} — ${formatPrice(service.finalPrice)}
                </div>
            `,
					)
					.join("")
			: "Zatím nebyla vybrána žádná služba.";
	}

	// Update prices in service cards
	document
		.querySelectorAll(".price-amount[data-base-price]")
		.forEach((element) => {
			const basePrice = Number(element.dataset.basePrice);
			const finalPrice = roundPrice(basePrice * getCarMultiplier());

			element.innerHTML = formatStartingPrice(finalPrice);
		});

	// Update prices in the form service select
	if (serviceSelect) {
		Array.from(serviceSelect.options).forEach((option) => {
			if (!option.dataset.price) return;

			const basePrice = Number(option.dataset.price);
			const finalPrice = roundPrice(basePrice * getCarMultiplier());

			option.textContent = `${option.dataset.name} — ${formatStartingPrice(finalPrice)}`;
		});
	}

	syncServiceCheckboxes();

	return total;
}

// Render service checkboxes
function renderServiceCheckboxes() {
	if (!serviceCheckboxes) return;

	serviceCheckboxes.innerHTML = catalog
		.filter((item) => item.active)
		.map(
			(item) => `
            <label class="service-checkbox">
                <input
                    type="checkbox"
                    value="${item.id}"
                    data-name="${item.name}"
                    data-price="${item.price}"
                    ${selectedServices.has(item.id) ? "checked" : ""}
                >

                <span>
                    <strong>${item.name}</strong>
                    <small>${formatStartingPrice(
											roundPrice(item.price * getCarMultiplier()),
										)}</small>
                </span>
            </label>
        `,
		)
		.join("");

	updateServiceDropdownLabel();
}

// Synchronize checkboxes with selectedServices

function syncServiceCheckboxes() {
	if (!serviceCheckboxes) return;

	serviceCheckboxes
		.querySelectorAll('input[type="checkbox"]')
		.forEach((input) => {
			input.checked = selectedServices.has(input.value);

			const service = catalog.find((item) => item.id === input.value);
			const priceElement = input.closest("label")?.querySelector("small");

			if (service && priceElement) {
				priceElement.innerHTML = formatStartingPrice(
					roundPrice(service.price * getCarMultiplier()),
				);
			}
		});

	updateServiceDropdownLabel();
}

// Update dropdown label
function updateServiceDropdownLabel() {
	if (!serviceDropdownLabel) return;

	const count = selectedServices.size;

	serviceDropdownLabel.textContent = count
		? `Vybrané služby (${count})`
		: "Vyberte služby";
}

// Handle checkbox changes
if (serviceCheckboxes) {
	serviceCheckboxes.addEventListener("change", (event) => {
		const input = event.target;

		if (input.type !== "checkbox") return;

		const id = input.value;

		if (input.checked) {
			selectedServices.set(id, {
				id,
				name: input.dataset.name,
				price: Number(input.dataset.price) || 0,
			});
		} else {
			selectedServices.delete(id);
		}

		updateTotalPrice();
		syncSelectedButtons();
		updateServiceDropdownLabel();
	});
}

// Open / close dropdown
if (serviceDropdownTrigger && serviceDropdown) {
	serviceDropdownTrigger.addEventListener("click", () => {
		const isOpen = !serviceDropdown.hidden;

		serviceDropdown.hidden = isOpen;

		serviceDropdownTrigger.setAttribute("aria-expanded", String(!isOpen));
	});

	document.addEventListener("click", (event) => {
		if (!event.target.closest("#service-multiselect")) {
			serviceDropdown.hidden = true;
			serviceDropdownTrigger.setAttribute("aria-expanded", "false");
		}
	});
}

// Select or deselect a service
function toggleService(id, name, price) {
	if (selectedServices.has(id)) {
		selectedServices.delete(id);
	} else {
		selectedServices.set(id, {
			id,
			name,
			price: Number(price) || 0,
		});
	}

	updateTotalPrice();
	syncSelectedButtons();
	syncServiceCheckboxes();

	if (typeof loadBookingSlots === "function") {
		loadBookingSlots();
	}
}

// Update buttons on service cards
function syncSelectedButtons() {
	document.querySelectorAll(".service-order").forEach((button) => {
		const selected = selectedServices.has(button.dataset.service);

		button.classList.toggle("selected", selected);
		button.textContent = selected ? "Vybráno ✓" : "Objednat";
	});
}

// Click on service cards
document.addEventListener("click", (event) => {
	const button = event.target.closest(".service-order");

	if (!button) return;

	toggleService(
		button.dataset.service,
		button.dataset.name,
		button.dataset.price,
	);
});

// Select service from contact form
if (serviceSelect) {
	serviceSelect.addEventListener("change", () => {
		const option = serviceSelect.selectedOptions[0];

		if (!option || !option.value) return;

		toggleService(option.value, option.dataset.name, option.dataset.price);

		serviceSelect.value = "";
	});
}

// Recalculate when vehicle class changes
if (carTypeSelect) {
	carTypeSelect.addEventListener("change", () => {
		if (carTypeFormSelect) {
			carTypeFormSelect.value = carTypeSelect.value;
		}

		updateTotalPrice();
	});
}

if (carTypeFormSelect) {
	carTypeFormSelect.addEventListener("change", () => {
		if (!carTypeSelect) return;

		carTypeSelect.value = carTypeFormSelect.value;

		carTypeSelect.dispatchEvent(new Event("change", { bubbles: true }));
	});
}

// ========================================
// LOAD DATA.JSON — ONLY ONCE
// ========================================

fetch("./data.json")
	.then((response) => {
		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`);
		}

		return response.json();
	})
	.then((data) => {
		catalog = Array.isArray(data.catalog) ? data.catalog : [];
		carTypes = Array.isArray(data.carTypes) ? data.carTypes : [];

		// VEHICLE TYPES
		if (carTypeSelect) {
			carTypes.forEach((car) => {
				const option = document.createElement("option");

				option.value = car.id;
				option.textContent = `${car.name} (${car.examples})`;
				option.dataset.multiplier = car.multiplier;

				carTypeSelect.appendChild(option);
			});
		}
		syncCarTypeOptions();

		// SERVICES IN CONTACT FORM
		renderServiceCheckboxes();

		// FEATURES SECTION
		const featuresContainer = document.querySelector("#svc");

		if (featuresContainer) {
			catalog
				.filter((item) => item.active)
				.forEach((item, index) => {
					const count = index + 1;

					featuresContainer.insertAdjacentHTML(
						"beforeend",
						`
                        <article class="svc reveal">
                            <span class="svc-num">
                                ${count < 10 ? "0" + count : count}
                            </span>
                            <h3>${item.name}</h3>
                            <p>${item.description}</p>
                            <ul>
                                ${(item.features || [])
																	.map((feature) => `<li>${feature}</li>`)
																	.join("")}
                            </ul>
                        </article>
                        `,
					);
				});

			observeReveals(featuresContainer);
		}

		// PRICE CARDS
		const priceContainer = document.querySelector("#services");

		if (priceContainer) {
			catalog
				.filter((item) => item.active)
				.forEach((item) => {
					priceContainer.insertAdjacentHTML(
						"beforeend",
						`
                        <div class="price reveal">
                            <div class="price-name">${item.name}</div>

                            <div
                                class="price-amount"
                                data-base-price="${item.price}"
                            >
${formatStartingPrice(item.price)}
                            </div>

                            <p class="price-desc">${item.description}</p>

                            <ul class="price-list">
                                ${(item.features || [])
																	.map((feature) => `<li>${feature}</li>`)
																	.join("")}
                            </ul>

                            <div class="service-button">
                                <p class="service-info">
                                    Tato služba byla vybrána a přidána do formuláře v dolní části stránky
                                </p>

                                <button
                                    type="button"
                                    class="btn btn-dark service-order"
                                    data-service="${item.id}"
                                    data-name="${item.name}"
                                    data-price="${item.price}"
                                >
                                    Objednat
                                </button>
                            </div>
                        </div>
                        `,
					);
				});

			observeReveals(priceContainer);
		}

		updateTotalPrice();
		syncSelectedButtons();
	})
	.catch((error) => {
		console.error("Chyba při načítání data.json:", error);
	});

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

// ========================================
// GOOGLE CALENDAR — AVAILABLE BOOKING SLOTS
// ========================================

const BOOKING_API_URL =
	"https://script.google.com/macros/s/AKfycbxSXG1RVhQYMCFbKREmOlVHzxAgDe01XtoxzgYrQ-CaOnjHLrE4td18Gc5MtgrmBIC4/exec";

const bookingDate = document.getElementById("booking-date");
const bookingTime = document.getElementById("booking-time");

let slotsRequestId = 0;

async function loadBookingSlots() {
	if (!bookingDate || !bookingTime) return;

	const date = bookingDate.value;
	const carTypeId = carTypeFormSelect?.value || "";
	const serviceIds = Array.from(selectedServices.keys());

	bookingTime.replaceChildren();

	if (!date || !carTypeId || serviceIds.length === 0) {
		bookingTime.disabled = true;

		const option = document.createElement("option");
		option.value = "";
		option.textContent = "Vyberte datum, vozidlo a služby";
		bookingTime.appendChild(option);

		return;
	}

	const requestId = ++slotsRequestId;

	bookingTime.disabled = true;

	const loadingOption = document.createElement("option");
	loadingOption.textContent = "Načítáme volné termíny...";
	bookingTime.appendChild(loadingOption);

	try {
		const params = new URLSearchParams({
			action: "slots",
			date: date,
			serviceIds: JSON.stringify(serviceIds),
			carTypeId: carTypeId,
		});

		const response = await fetch(`${BOOKING_API_URL}?${params.toString()}`);

		if (!response.ok) {
			throw new Error("Nepodařilo se načíst termíny.");
		}

		const result = await response.json();

		if (requestId !== slotsRequestId) return;

		if (!result.success) {
			throw new Error(result.error || "Chyba při načítání termínů.");
		}

		bookingTime.replaceChildren();

		const firstOption = document.createElement("option");
		firstOption.value = "";
		firstOption.textContent = result.data.length
			? "Vyberte čas"
			: "Žádné volné termíny";

		bookingTime.appendChild(firstOption);

		result.data.forEach((slot) => {
			const option = document.createElement("option");

			option.value = slot.start;
			option.textContent = `${slot.start} – ${slot.end}`;

			bookingTime.appendChild(option);
		});

		bookingTime.disabled = result.data.length === 0;
	} catch (error) {
		console.error("Booking slots error:", error);

		if (requestId !== slotsRequestId) return;

		bookingTime.replaceChildren();

		const option = document.createElement("option");
		option.value = "";
		option.textContent = "Chyba načítání. Zkuste znovu.";

		bookingTime.appendChild(option);
		bookingTime.disabled = true;
	}
}

if (bookingDate) {
	bookingDate.addEventListener("change", loadBookingSlots);
}

// Reload slots when selected services change
if (serviceCheckboxes) {
	serviceCheckboxes.addEventListener("change", loadBookingSlots);
}

// Reload slots when vehicle class changes
if (carTypeFormSelect) {
	carTypeFormSelect.addEventListener("change", loadBookingSlots);
}

// Set minimum booking date to today
if (bookingDate) {
	const today = new Date();
	const localToday = [
		today.getFullYear(),
		String(today.getMonth() + 1).padStart(2, "0"),
		String(today.getDate()).padStart(2, "0"),
	].join("-");

	bookingDate.min = localToday;
}

// Contact form -> Formspree

var form = document.getElementById("contact-form");
var formStatus = document.getElementById("form-status");

if (!formStatus) {
	console.error("Element #form-status not found");
}

function showFormStatus(message) {
	if (!formStatus) return;

	formStatus.textContent = message;
	formStatus.classList.add("show");
}

var citySelect = selectedCity;
var placeInput = document.getElementById("place");

if (citySelect && placeInput) {
	placeInput.value = citySelect;
}

if (form) {
	form.addEventListener("submit", async function (ev) {
		ev.preventDefault();

		const name = form.elements.namedItem("name")?.value.trim() || "";
		const phone = form.elements.namedItem("phone")?.value.trim() || "";
		const email = form.elements.namedItem("email")?.value.trim() || "";
		const date = bookingDate?.value || "";
		const time = bookingTime?.value || "";
		const carTypeId = carTypeFormSelect?.value || "";
		const place = placeInput?.value.trim() || "";
		const message = form.elements.namedItem("message")?.value.trim() || "";
		const serviceIds = Array.from(selectedServices.keys());

		if (!name || !phone) {
			showFormStatus("Vyplňte prosím jméno a telefon.");
			return;
		}

		if (!carTypeId) {
			showFormStatus("Vyberte prosím třídu vozidla.");
			return;
		}

		if (serviceIds.length === 0) {
			showFormStatus("Vyberte prosím alespoň jednu službu.");
			return;
		}

		if (!date || !time) {
			showFormStatus("Vyberte prosím datum a volný čas rezervace.");
			return;
		}

		const note = [place ? "Místo výjezdu: " + place : "", message]
			.filter(Boolean)
			.join("\n\n");

		const payload = {
			name: name,
			phone: phone,
			email: email,
			vehicle: "",
			note: note,
			date: date,
			time: time,
			serviceIds: serviceIds,
			carTypeId: carTypeId,
		};

		const submitButton = form.querySelector('[type="submit"]');

		if (submitButton) {
			submitButton.disabled = true;
		}

		showFormStatus("Odesíláme žádost o rezervaci...");

		try {
			const response = await fetch(BOOKING_API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "text/plain;charset=utf-8",
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				throw new Error("HTTP error: " + response.status);
			}

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error || "Rezervaci se nepodařilo vytvořit.");
			}

			showFormStatus(
				"Děkujeme! Vaše rezervace byla přijata. Termín je dočasně blokován na 12 hodin a čeká na naše potvrzení.",
			);

			form.reset();
			selectedServices.clear();

			if (carTypeSelect) {
				carTypeSelect.value = "";
			}

			syncCarTypeOptions();
			updateTotalPrice();
			syncSelectedButtons();

			if (citySelect && placeInput) {
				placeInput.value = citySelect;
			}

			if (bookingTime) {
				bookingTime.replaceChildren();
				const option = document.createElement("option");
				option.value = "";
				option.textContent = "Nejprve vyberte datum";
				bookingTime.appendChild(option);
				bookingTime.disabled = true;
			}
		} catch (error) {
			console.error("Booking error:", error);

			showFormStatus(
				"Rezervaci se nepodařilo odeslat. " +
					(error.message || "Zkuste to prosím znovu.") +
					" Případně nám zavolejte na +420 734 676 271.",
			);
		} finally {
			if (submitButton) {
				submitButton.disabled = false;
			}
		}
	});
}

window.addEventListener("error", function (e) {
	alert("JS ERROR: " + e.message + "\nСтрока: " + e.lineno);
});

window.addEventListener("unhandledrejection", function (e) {
	alert("PROMISE ERROR: " + e.reason);
});
