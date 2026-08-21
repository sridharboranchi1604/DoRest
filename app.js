const services = [
    {
        id: "home-cleaning",
        name: "Home Cleaning",
        icon: "🧹",
        description: "Complete cleaning for your home",
        basePrice: 399,
        category: "Cleaning"
    },

    {
        id: "kitchen-cleaning",
        name: "Kitchen Cleaning",
        icon: "🍳",
        description: "Deep clean your kitchen",
        basePrice: 499,
        category: "Cleaning"
    },

    {
        id: "bathroom-cleaning",
        name: "Bathroom Cleaning",
        icon: "🚿",
        description: "Deep bathroom cleaning",
        basePrice: 349,
        category: "Cleaning"
    },

    {
        id: "laundry",
        name: "Laundry",
        icon: "👕",
        description: "Wash, dry and fold",
        basePrice: 299,
        category: "Laundry"
    },

    {
        id: "dishwashing",
        name: "Dishwashing",
        icon: "🍽️",
        description: "Fresh and clean dishes",
        basePrice: 249,
        category: "Cleaning"
    },

    {
        id: "cooking",
        name: "Cooking",
        icon: "👨‍🍳",
        description: "Fresh home-cooked meals at your doorstep",
        basePrice: 399,
        category: "Cooking"
    },

    {
        id: "home-repairs",
        name: "Home Repairs",
        icon: "🔧",
        description: "Everyday repair assistance",
        basePrice: 399,
        category: "Repairs"
    },

    {
        id: "beauty",
        name: "Beauty at Home",
        icon: "💆",
        description: "Beauty services at your door",
        basePrice: 599,
        category: "Beauty"
    },

    {
        id: "more",
        name: "More Services",
        icon: "＋",
        description: "Explore more home services",
        basePrice: 399,
        category: "More"
    }
];


const popularIds = [
    "home-cleaning",
    "cooking",
    "bathroom-cleaning"
];


const state = {
    service: null,
    duration: 1,
    date: null,
    time: null,
    location: localStorage.getItem("dorestLocation") || ""
};


document.addEventListener("DOMContentLoaded", () => {

    renderServices();

    renderPopular();

    prepareDates();


    if (state.location) {

        document.getElementById("locationText").textContent =
            state.location;

    }

});


/* =========================================================
   SERVICES
========================================================= */

function renderServices(list = services) {

    const grid = document.getElementById("serviceGrid");


    if (!list.length) {

        grid.innerHTML = `
            <div class="empty-state">
                No services found.
                Try another search.
            </div>
        `;

        return;
    }


    grid.innerHTML = list.map(service => {

        return `
            <article
                class="service-card"
                onclick="openBooking('${service.id}')"
            >

                <div class="service-icon">
                    ${service.icon}
                </div>

                <h3>
                    ${service.name}
                </h3>

                <p>
                    ${service.description}
                </p>

            </article>
        `;

    }).join("");
}


function renderPopular() {

    const grid = document.getElementById("popularGrid");


    grid.innerHTML = popularIds.map(id => {

        const service = services.find(
            item => item.id === id
        );


        return `
            <article
                class="popular-card"
                onclick="openBooking('${service.id}')"
            >

                <div class="service-icon">
                    ${service.icon}
                </div>

                <div>

                    <h3>
                        ${service.name}
                    </h3>

                    <p>
                        Starting from ₹${service.basePrice}
                    </p>

                </div>

            </article>
        `;

    }).join("");
}


/* =========================================================
   SEARCH
========================================================= */

function filterServices() {

    const query =
        document
            .getElementById("serviceSearch")
            .value
            .trim()
            .toLowerCase();


    if (!query) {

        renderServices();

        return;
    }


    const filtered = services.filter(service => {

        return (
            service.name
                .toLowerCase()
                .includes(query)

            ||

            service.description
                .toLowerCase()
                .includes(query)

            ||

            service.category
                .toLowerCase()
                .includes(query)
        );

    });


    renderServices(filtered);


    document.getElementById("services").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function resetServiceFilter() {

    document.getElementById("serviceSearch").value = "";

    renderServices();
}


function focusServices() {

    document.getElementById("services").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================================================
   LOCATION
========================================================= */

function openLocationModal() {

    const modal =
        document.getElementById("locationModal");


    document.getElementById("locationInput").value =
        state.location;


    modal.classList.add("active");


    setTimeout(() => {

        document
            .getElementById("locationInput")
            .focus();

    }, 100);
}


function closeLocationModal() {

    document
        .getElementById("locationModal")
        .classList.remove("active");
}


function saveLocation() {

    const value =
        document
            .getElementById("locationInput")
            .value
            .trim();


    if (!value) {

        showToast("Please enter your location.");

        return;
    }


    state.location = value;


    localStorage.setItem(
        "dorestLocation",
        value
    );


    document.getElementById("locationText").textContent =
        value;


    closeLocationModal();


    showToast("Location saved.");
}


/* =========================================================
   BOOKING
========================================================= */

function openBooking(serviceId) {

    const service =
        services.find(
            item => item.id === serviceId
        );


    if (!service) {
        return;
    }


    state.service = service;

    state.duration = 1;

    state.date = null;

    state.time = null;


    document.getElementById("bookingTitle").textContent =
        service.name;


    document.getElementById("bookingDescription").textContent =
        service.description;


    document.getElementById("bookingIcon").textContent =
        service.icon;


    renderDurations();

    prepareDates();

    renderTimes();

    updateBookingPrice();


    document
        .getElementById("bookingModal")
        .classList.add("active");
}


/* =========================================================
   DURATION
========================================================= */

function renderDurations() {

    const container =
        document.getElementById("durationOptions");


    const durations = [
        1,
        2,
        3,
        4
    ];


    container.innerHTML = durations.map(hours => {

        return `
            <button
                class="option-btn ${
                    state.duration === hours
                        ? "active"
                        : ""
                }"
                onclick="selectDuration(${hours})"
            >

                <strong>
                    ${hours}
                    ${hours === 1 ? "Hour" : "Hours"}
                </strong>

                <span>
                    ₹${calculatePrice(hours)}
                </span>

            </button>
        `;

    }).join("");
}


function selectDuration(hours) {

    state.duration = hours;

    renderDurations();

    updateBookingPrice();
}


/* =========================================================
   DATE
========================================================= */

function prepareDates() {

    const container =
        document.getElementById("dateOptions");


    const dates = [];


    for (let i = 0; i < 5; i++) {

        const date = new Date();

        date.setDate(
            date.getDate() + i
        );


        const weekday =
            date.toLocaleDateString(
                "en-IN",
                {
                    weekday: "short"
                }
            );


        const day =
            date.getDate();


        const month =
            date.toLocaleDateString(
                "en-IN",
                {
                    month: "short"
                }
            );


        const iso =
            formatDateKey(date);


        dates.push({
            iso,

            weekday:
                i === 0
                    ? "Today"
                    : i === 1
                        ? "Tomorrow"
                        : weekday,

            day,

            month
        });
    }


    if (!state.date) {

        state.date =
            dates[0].iso;

    }


    container.innerHTML =
        dates.map(date => {

            return `
                <button
                    class="date-btn ${
                        state.date === date.iso
                            ? "active"
                            : ""
                    }"
                    onclick="selectDate('${date.iso}')"
                >

                    <strong>
                        ${date.weekday}
                    </strong>

                    <span>
                        ${date.day}
                        ${date.month}
                    </span>

                </button>
            `;

        }).join("");
}


function selectDate(date) {

    state.date = date;

    prepareDates();

    renderTimes();
}


/* =========================================================
   TIME
========================================================= */

function renderTimes() {

    const container =
        document.getElementById("timeOptions");


    const times = [
        "09:00 AM",
        "11:00 AM",
        "01:00 PM",
        "03:00 PM",
        "05:00 PM",
        "07:00 PM"
    ];


    if (!state.time) {

        state.time = times[0];

    }


    container.innerHTML =
        times.map(time => {

            return `
                <button
                    class="time-btn ${
                        state.time === time
                            ? "active"
                            : ""
                    }"
                    onclick="selectTime('${time}')"
                >
                    ${time}
                </button>
            `;

        }).join("");
}


function selectTime(time) {

    state.time = time;

    renderTimes();
}


/* =========================================================
   PRICE
========================================================= */

function calculatePrice(
    hours = state.duration
) {

    if (!state.service) {

        return 0;

    }


    return state.service.basePrice * hours;
}


function updateBookingPrice() {

    document.getElementById("bookingPrice").textContent =
        `₹${calculatePrice().toLocaleString("en-IN")}`;
}


/* =========================================================
   ADDRESS
========================================================= */

function continueToAddress() {

    if (
        !state.service ||
        !state.date ||
        !state.time
    ) {

        showToast(
            "Please select all booking options."
        );

        return;
    }


    closeBookingModal();


    document.getElementById(
        "addressServiceName"
    ).textContent =
        state.service.name;


    document.getElementById(
        "addressTotal"
    ).textContent =
        `₹${calculatePrice().toLocaleString("en-IN")}`;


    document
        .getElementById("addressModal")
        .classList.add("active");
}


function reviewBooking() {

    const addressLine1 =
        document
            .getElementById("addressLine1")
            .value
            .trim();


    const addressLine2 =
        document
            .getElementById("addressLine2")
            .value
            .trim();


    const city =
        document
            .getElementById("addressCity")
            .value
            .trim();


    const pin =
        document
            .getElementById("addressPin")
            .value
            .trim();


    const landmark =
        document
            .getElementById("addressLandmark")
            .value
            .trim();


    if (
        !addressLine1 ||
        !addressLine2 ||
        !city ||
        pin.length !== 6
    ) {

        showToast(
            "Please complete your address."
        );

        return;
    }


    const addressParts = [
        addressLine1,
        addressLine2,
        city,
        pin,
        landmark
            ? `Near ${landmark}`
            : ""
    ].filter(Boolean);


    const fullAddress =
        addressParts.join(", ");


    document.getElementById(
        "reviewService"
    ).textContent =
        state.service.name;


    document.getElementById(
        "reviewDuration"
    ).textContent =
        `${state.duration} ${
            state.duration === 1
                ? "Hour"
                : "Hours"
        }`;


    document.getElementById(
        "reviewDate"
    ).textContent =
        formatReadableDate(
            state.date
        );


    document.getElementById(
        "reviewTime"
    ).textContent =
        state.time;


    document.getElementById(
        "reviewAddress"
    ).textContent =
        fullAddress;


    document.getElementById(
        "reviewTotal"
    ).textContent =
        `₹${calculatePrice().toLocaleString("en-IN")}`;


    document
        .getElementById("addressModal")
        .classList.remove("active");


    document
        .getElementById("reviewModal")
        .classList.add("active");
}


/* =========================================================
   CONFIRM BOOKING
========================================================= */

function confirmBooking() {

    const bookingId =
        `DR-${Math.floor(
            100000 +
            Math.random() *
            900000
        )}`;


    document.getElementById(
        "bookingId"
    ).textContent =
        bookingId;


    document.getElementById(
        "confirmService"
    ).textContent =
        state.service.name;


    document.getElementById(
        "confirmDateTime"
    ).textContent =
        `${formatReadableDate(
            state.date
        )} • ${state.time}`;


    document.getElementById(
        "confirmTotal"
    ).textContent =
        `₹${calculatePrice().toLocaleString("en-IN")}`;


    document
        .getElementById("reviewModal")
        .classList.remove("active");


    document
        .getElementById("confirmationModal")
        .classList.add("active");
}


/* =========================================================
   CLOSE MODALS
========================================================= */

function closeBookingModal() {

    document
        .getElementById("bookingModal")
        .classList.remove("active");
}


function closeAddressModal() {

    document
        .getElementById("addressModal")
        .classList.remove("active");
}


function closeReviewModal() {

    document
        .getElementById("reviewModal")
        .classList.remove("active");
}


function closeConfirmation() {

    document
        .getElementById("confirmationModal")
        .classList.remove("active");
}


/* =========================================================
   DATE HELPERS
========================================================= */

function formatDateKey(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;
}


function formatReadableDate(
    dateString
) {

    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    return date.toLocaleDateString(
        "en-IN",
        {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   MOBILE MENU
========================================================= */

function toggleMobileMenu() {

    document
        .getElementById("mobileMenu")
        .classList.toggle("active");
}


function closeMobileMenu() {

    document
        .getElementById("mobileMenu")
        .classList.remove("active");
}


/* =========================================================
   HOME
========================================================= */

function goHome() {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    const toast =
        document.getElementById("toast");


    toast.textContent = message;


    toast.classList.add("show");


    clearTimeout(
        window.toastTimer
    );


    window.toastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 2600);
}


/* =========================================================
   CLOSE MODALS BY CLICKING OUTSIDE
========================================================= */

window.addEventListener(
    "click",
    event => {  

        if (
            event.target.classList.contains(
                "modal-overlay"
            )
        ) {

            event.target.classList.remove(
                "active"
            );

        }

    }
);