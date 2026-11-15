(function () {
	"use strict";

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
	var items = document.querySelectorAll(".reveal");
	if ("IntersectionObserver" in window) {
		var io = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (e) {
					if (e.isIntersecting) {
						e.target.classList.add("in");
						io.unobserve(e.target);
					}
				});
			},
			{ threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
		);
		items.forEach(function (el) {
			io.observe(el);
		});
	} else {
		items.forEach(function (el) {
			el.classList.add("in");
		});
	}

	// Choose city

	const markers = {};
	let coverageCookie = "";
	let selectedCity = coverageCookie
		? coverageCookie.split("=")[1]
		: "Pardubice";
	document.cookie.split(";").forEach(function (c) {
		if (c.trim().startsWith("coverage=")) {
			coverageCookie = c.trim();
		}
	});
	const cities = document.getElementById("coverage-list");
	cities.querySelectorAll(".cov-city").forEach(function (el) {
		if (window && window.document && window.document.cookie) {
			if (coverageCookie.startsWith("coverage=")) {
				if (el.innerText === coverageCookie.split("=")[1]) {
					el.classList.add("active");
				}
			} else {
				el[0].classList.add("active");
			}
		}
		el.addEventListener("click", function () {
			cities.querySelectorAll(".cov-city").forEach(function (el) {
				el.classList.remove("active");
			});
			selectedCity = el.innerText;
			el.classList.add("active");
			document.cookie = "coverage=" + el.innerText + "; expires=365";
			document.getElementById("place").value = el.innerText;
		});
	});

	// Map
	(function () {
		"use strict";

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

		if (!mapElement || typeof L === "undefined") return;

		const map = L.map("coverage-map", {
			scrollWheelZoom: true,
		});

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

		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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

		// Add city markers
		Object.entries(cities).forEach(([name, coords]) => {
			const marker = L.marker(coords, {
				icon: name === "Pardubice" ? centerIcon : normalIcon,
			}).addTo(map);

			marker.bindPopup("<strong>" + name + "</strong>");

			marker.on("click", function () {
				selectCity(name, false);
			});

			markers[name] = marker;
		});

		// Map boundaries
		const bounds = L.latLngBounds(Object.values(cities));

		map.fitBounds(bounds, {
			padding: [35, 35],
		});

		// Select city
		function selectCity(name, moveMap = true) {
			if (!cities[name]) return;

			// Update markers
			Object.entries(markers).forEach(([city, marker]) => {
				if (city === selectedCity) {
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

		// Click on city list
		document.querySelectorAll(".cov-city").forEach((button) => {
			button.addEventListener("click", function () {
				selectCity(this.dataset.city);
			});
		});

		// Initial selection
		selectCity("Pardubice", false);

		// Fix map rendering if loaded in a reveal section
		setTimeout(function () {
			map.invalidateSize();
		}, 300);
	})();

	// Contact form -> mailto
	var form = document.getElementById("contact-form");
	var status = document.getElementById("form-status");
	var serviceSelect = document.getElementById("service");
	var citySelect = coverageCookie ? coverageCookie.split("=")[1] : "Pardubice";
	if (citySelect) {
		document.getElementById("place").value = citySelect;
	}
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
})();
