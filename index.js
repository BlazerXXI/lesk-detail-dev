const FORMSPREE_ENDPOINT = "https://formspree.io/f/mdegzwrd";

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

// Synchronize vehicle selectors
function syncCarTypeOptions() {
	if (!carTypeSelect || !carTypeFormSelect) return;

	const selectedValue = carTypeSelect.value;

	carTypeFormSelect.replaceChildren(
		...Array.from(carTypeSelect.options, (option) => option.cloneNode(true)),
	);

	carTypeFormSelect.value = selectedValue;
}

const formatPrice = (price) => `${price.toLocaleString("cs-CZ")} Kč`;

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
		finalPrice: Math.round(service.price * multiplier),
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
		totalElement.textContent = formatPrice(total);
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
			const finalPrice = Math.round(basePrice * getCarMultiplier());

			element.innerHTML = `${formatPrice(finalPrice)}`;
		});

	// Update prices in the form service select
	if (serviceSelect) {
		Array.from(serviceSelect.options).forEach((option) => {
			if (!option.dataset.price) return;

			const basePrice = Number(option.dataset.price);
			const finalPrice = Math.round(basePrice * getCarMultiplier());

			option.textContent = `${option.dataset.name} — ${formatPrice(finalPrice)}`;
		});
	}

	return total;
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
		if (serviceSelect) {
			catalog
				.filter((item) => item.active)
				.forEach((item) => {
					const option = document.createElement("option");

					option.value = item.id;
					option.textContent = `${item.name} — ${item.price} Kč`;
					option.dataset.name = item.name;
					option.dataset.price = item.price;

					serviceSelect.appendChild(option);
				});
		}

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
                                ${formatPrice(item.price)}
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

        var name = form.elements.namedItem("name")?.value.trim() || "";
								var phone = form.elements.namedItem("phone")?.value.trim() || "";

        var selectedCar = carTypeSelect?.selectedOptions[0];
        var carType = selectedCar ? selectedCar.textContent.trim() : "";

        var service = getPricedServices()
            .map((item) => `${item.name} — ${formatPrice(item.finalPrice)}`)
            .join("\n");

        var total = updateTotalPrice();
        var place = form.elements.namedItem("place")?.value.trim() || "";
								var message = form.elements.namedItem("message")?.value.trim() || "";

        if (!name || !phone) {
    showFormStatus(
        "Vyplňte prosím jméno a telefon, abychom se vám mohli ozvat."
    );
    return;
}

        var subject =
            "Poptávka detailing — " + name +
            (carType ? " (" + carType + ")" : "");

        var payload = {
            _subject: subject,
            name: name,
            phone: phone,
            car_type: carType,
            services: service || "Nebyla vybrána žádná služba",
            total_price: total + " Kč",
            place: place,
            message: message
        };

        var submitButton = form.querySelector('[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
        }

			     showFormStatus("Odesíláme vaši poptávku...");

        try {
            var response = await fetch(FORMSPREE_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error("Formspree error: " + response.status);
            }

showFormStatus(
    "Děkujeme! Vaše poptávka byla úspěšně odeslána. Brzy se vám ozveme."
);

            form.reset();

            if (citySelect && placeInput) {
                placeInput.value = citySelect;
            }

        } catch (error) {
            console.error(error);

 showFormStatus(
    "Odeslání se nezdařilo. Zkuste to prosím znovu nebo nám zavolejte na +420 734 676 271."
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