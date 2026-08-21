const fallbackServices = [
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


let services = [...fallbackServices];
let servicesLoadedFromFirestore = false;


async function loadServicesFromFirestore() {

    try {

        if (!window.dorestDb) return;

        const snapshot = await window.dorestDb
            .collection("services")
            .where("active", "==", true)
            .get();

        if (snapshot.empty) return;

        const remoteServices = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            .filter(service =>
                service.name &&
                service.description
            );

        if (!remoteServices.length) return;

        remoteServices.sort(
            (a, b) =>
                (a.sortOrder ?? 999) -
                (b.sortOrder ?? 999)
        );

        services = remoteServices;

        servicesLoadedFromFirestore = true;

        renderServices();
        renderPopular();

    } catch (error) {

        console.warn(
            "DoRest services could not be loaded from Firestore. Using local catalog.",
            error
        );

    }
}


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

    location:
        localStorage.getItem("dorestLocation") || "",

    address: "",

    addressLocation: null,

    selectedAddressId: "",

    cooking: {

        type: "one-time",

        meal: "lunch",

        cuisine: "south-indian",

        preference: "vegetarian",

        people: "1-2",

        instructions: ""

    }

};


document.addEventListener("DOMContentLoaded", () => {

    renderServices();

    renderPopular();

    prepareDates();

    loadServicesFromFirestore();

    if (state.location) {

        document.getElementById(
            "locationText"
        ).textContent = state.location;

    }

    document
        .getElementById("saveAddressCheckbox")
        ?.addEventListener("change", event => {

            const wrap =
                document.getElementById(
                    "saveAddressLabelWrap"
                );

            if (wrap) {

                wrap.hidden =
                    !event.target.checked;

            }

        });

});


/* =========================================================
   SERVICES
========================================================= */


function renderServices(list = services) {

    const grid =
        document.getElementById("serviceGrid");

    if (!grid) return;

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
                onclick="openBooking('${escapeHtml(service.id)}')"
            >

                <div class="service-icon">
                    ${service.icon || "🏠"}
                </div>

                <h3>
                    ${escapeHtml(service.name)}
                </h3>

                <p>
                    ${escapeHtml(service.description)}
                </p>

                <div class="service-card-bottom">

                    <span class="service-price">
                        From ₹${Number(
                            service.basePrice || 0
                        ).toLocaleString("en-IN")}
                    </span>

                    <button
                        class="service-details-btn"
                        type="button"
                        onclick="event.stopPropagation(); openServiceDetails(${JSON.stringify(service.id)})"
                    >
                        Details →
                    </button>

                </div>

            </article>
        `;

    }).join("");

}


function renderPopular() {

    const grid =
        document.getElementById("popularGrid");

    if (!grid) return;

    grid.innerHTML = popularIds.map(id => {

        const service =
            services.find(
                item => item.id === id
            );

        if (!service) return "";

        return `
            <article
                class="popular-card"
                onclick="openBooking('${escapeHtml(service.id)}')"
            >

                <div class="service-icon">
                    ${service.icon || "🏠"}
                </div>

                <div>

                    <h3>
                        ${escapeHtml(service.name)}
                    </h3>

                    <p>
                        Starting from ₹${Number(
                            service.basePrice || 0
                        ).toLocaleString("en-IN")}
                    </p>

                </div>

                <button
                    class="service-details-btn popular-details-btn"
                    type="button"
                    onclick="event.stopPropagation(); openServiceDetails(${JSON.stringify(service.id)})"
                >
                    View
                </button>

            </article>
        `;

    }).join("");

}


/* =========================================================
   SEARCH
========================================================= */


function filterServices() {

    const input =
        document.getElementById(
            "serviceSearch"
        );

    if (!input) return;

    const query =
        input.value
            .trim()
            .toLowerCase();

    if (!query) {

        renderServices();

        return;
    }


    const filtered =
        services.filter(service => {

            return (

                String(service.name || "")
                    .toLowerCase()
                    .includes(query)

                ||

                String(service.description || "")
                    .toLowerCase()
                    .includes(query)

                ||

                String(service.category || "")
                    .toLowerCase()
                    .includes(query)

            );

        });


    renderServices(filtered);


    document
        .getElementById("services")
        ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

}


function resetServiceFilter() {

    const input =
        document.getElementById(
            "serviceSearch"
        );

    if (input) {

        input.value = "";

    }

    renderServices();

}


function focusServices() {

    document
        .getElementById("services")
        ?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

}


/* =========================================================
   LOCATION
========================================================= */


function openLocationModal() {

    const modal =
        document.getElementById(
            "locationModal"
        );

    if (!modal) return;

    const input =
        document.getElementById(
            "locationInput"
        );

    if (input) {

        input.value =
            state.location;

    }

    modal.classList.add("active");


    setTimeout(() => {

        input?.focus();

    }, 100);

}


function closeLocationModal() {

    document
        .getElementById("locationModal")
        ?.classList.remove("active");

}


function saveLocation() {

    const input =
        document.getElementById(
            "locationInput"
        );

    if (!input) return;

    const value =
        input.value.trim();

    if (!value) {

        showToast(
            "Please enter your location."
        );

        return;
    }


    state.location = value;


    localStorage.setItem(
        "dorestLocation",
        value
    );


    const locationText =
        document.getElementById(
            "locationText"
        );

    if (locationText) {

        locationText.textContent =
            value;

    }


    closeLocationModal();

    showToast("Location saved.");

}


/* =========================================================
   SERVICE DETAILS
========================================================= */


function formatINR(value) {

    return `₹${Number(
        value || 0
    ).toLocaleString("en-IN")}`;

}


function getServiceDurationPrice(
    service,
    hours
) {

    if (!service) return 0;

    return Number(
        service.basePrice || 0
    ) * hours;

}


function openServiceDetails(serviceId) {

    const service =
        services.find(
            item => item.id === serviceId
        );

    if (!service) return;


    document.getElementById(
        "detailsServiceIcon"
    ).textContent =
        service.icon || "🏠";


    document.getElementById(
        "detailsServiceName"
    ).textContent =
        service.name || "Service";


    document.getElementById(
        "detailsServiceDescription"
    ).textContent =
        service.description ||
        "Professional home service from DoRest.";


    document.getElementById(
        "detailsBasePrice"
    ).textContent =
        formatINR(service.basePrice);


    document.getElementById(
        "detailsCategory"
    ).textContent =
        service.category ||
        "Home Service";


    if (service.id === "cooking") {

        document.getElementById(
            "detailsOneHourPrice"
        ).textContent =
            "From ₹399";

        document.getElementById(
            "detailsTwoHourPrice"
        ).textContent =
            "Custom";

        document.getElementById(
            "detailsFourHourPrice"
        ).textContent =
            "Custom";

        document.getElementById(
            "detailsPricingNote"
        ).textContent =
            "Cooking uses personalized pricing based on meals, cuisine, food preference and number of people.";

    } else {

        document.getElementById(
            "detailsOneHourPrice"
        ).textContent =
            formatINR(
                getServiceDurationPrice(
                    service,
                    1
                )
            );

        document.getElementById(
            "detailsTwoHourPrice"
        ).textContent =
            formatINR(
                getServiceDurationPrice(
                    service,
                    2
                )
            );

        document.getElementById(
            "detailsFourHourPrice"
        ).textContent =
            formatINR(
                getServiceDurationPrice(
                    service,
                    4
                )
            );

        document.getElementById(
            "detailsPricingNote"
        ).textContent =
            "Pricing is loaded from your Firestore service catalog. Choose your duration during booking and the estimated total updates instantly.";

    }


    const bookButton =
        document.getElementById(
            "detailsBookBtn"
        );

    if (bookButton) {

        bookButton.onclick = () => {

            closeServiceDetails();

            openBooking(
                service.id
            );

        };

    }


    document
        .getElementById(
            "serviceDetailsModal"
        )
        ?.classList.add("active");

}


function closeServiceDetails() {

    document
        .getElementById(
            "serviceDetailsModal"
        )
        ?.classList.remove("active");

}


/* =========================================================
   BOOKING
========================================================= */


function openBooking(serviceId) {

    const service =
        services.find(
            item => item.id === serviceId
        );

    if (!service) return;


    state.service = service;

    state.duration = 1;

    state.date = null;

    state.time = null;


    resetCookingState();


    document.getElementById(
        "bookingTitle"
    ).textContent =
        service.name;


    document.getElementById(
        "bookingDescription"
    ).textContent =
        service.description;


    document.getElementById(
        "bookingIcon"
    ).textContent =
        service.icon || "🏠";


    const cookingOptions =
        document.getElementById(
            "cookingOptions"
        );


    const durationOptions =
        document
            .getElementById(
                "durationOptions"
            )
            ?.closest(
                ".booking-section"
            );


    if (service.id === "cooking") {

        if (cookingOptions) {

            cookingOptions.hidden =
                false;

        }

        if (durationOptions) {

            durationOptions.style.display =
                "none";

        }

        renderCookingOptions();

    } else {

        if (cookingOptions) {

            cookingOptions.hidden =
                true;

        }

        if (durationOptions) {

            durationOptions.style.display =
                "";

        }

    }


    prepareDates();

    renderDurations();

    renderTimes();

    updateBookingPrice();


    document
        .getElementById(
            "bookingModal"
        )
        ?.classList.add("active");

}


/* =========================================================
   COOKING BOOKING
========================================================= */


const cookingChoices = {

    type: [
        {
            value: "one-time",
            label: "One-time",
            note: "Single visit"
        },
        {
            value: "daily",
            label: "Daily",
            note: "Regular cooking"
        },
        {
            value: "weekly",
            label: "Weekly",
            note: "Weekly plan"
        }
    ],

    meal: [
        {
            value: "breakfast",
            label: "Breakfast",
            note: "Morning meal"
        },
        {
            value: "lunch",
            label: "Lunch",
            note: "Midday meal"
        },
        {
            value: "dinner",
            label: "Dinner",
            note: "Evening meal"
        },
        {
            value: "full-day",
            label: "Full Day",
            note: "All main meals"
        }
    ],

    cuisine: [
        {
            value: "south-indian",
            label: "South Indian",
            note: "Idli, dosa & more"
        },
        {
            value: "north-indian",
            label: "North Indian",
            note: "Roti, sabzi & more"
        },
        {
            value: "multi-cuisine",
            label: "Multi-Cuisine",
            note: "Flexible menu"
        },
        {
            value: "custom",
            label: "Custom Menu",
            note: "Tell us your menu"
        }
    ],

    preference: [
        {
            value: "vegetarian",
            label: "Vegetarian",
            note: "Veg meals"
        },
        {
            value: "non-vegetarian",
            label: "Non-Veg",
            note: "Non-veg meals"
        },
        {
            value: "both",
            label: "Both",
            note: "Veg + non-veg"
        }
    ],

    people: [
        {
            value: "1-2",
            label: "1–2 People",
            note: "Small household"
        },
        {
            value: "3-4",
            label: "3–4 People",
            note: "Small family"
        },
        {
            value: "5-6",
            label: "5–6 People",
            note: "Medium family"
        },
        {
            value: "7+",
            label: "7+ People",
            note: "Large household"
        }
    ]

};


function resetCookingState() {

    state.cooking = {

        type: "one-time",

        meal: "lunch",

        cuisine: "south-indian",

        preference: "vegetarian",

        people: "1-2",

        instructions: ""

    };


    const instructions =
        document.getElementById(
            "cookingInstructions"
        );

    if (instructions) {

        instructions.value = "";

    }

}


function renderCookingOptions() {

    renderCookingChoice(
        "cookingTypeOptions",
        "type",
        state.cooking.type,
        "selectCookingType"
    );


    renderCookingChoice(
        "cookingMealOptions",
        "meal",
        state.cooking.meal,
        "selectCookingMeal"
    );


    renderCookingChoice(
        "cookingCuisineOptions",
        "cuisine",
        state.cooking.cuisine,
        "selectCookingCuisine"
    );


    renderCookingChoice(
        "cookingPreferenceOptions",
        "preference",
        state.cooking.preference,
        "selectCookingPreference"
    );


    renderCookingChoice(
        "cookingPeopleOptions",
        "people",
        state.cooking.people,
        "selectCookingPeople"
    );

}


function renderCookingChoice(
    elementId,
    choiceKey,
    selectedValue,
    functionName
) {

    const container =
        document.getElementById(
            elementId
        );

    if (!container) return;


    container.innerHTML =
        cookingChoices[choiceKey]
            .map(choice => {

                return `
                    <button
                        type="button"
                        class="option-btn ${
                            selectedValue === choice.value
                                ? "active"
                                : ""
                        }"
                        onclick="${functionName}('${escapeHtml(choice.value)}')"
                    >

                        <strong>
                            ${escapeHtml(choice.label)}
                        </strong>

                        <span>
                            ${escapeHtml(choice.note)}
                        </span>

                    </button>
                `;

            })
            .join("");

}


function selectCookingType(value) {

    state.cooking.type =
        value;

    renderCookingOptions();

    updateBookingPrice();

}


function selectCookingMeal(value) {

    state.cooking.meal =
        value;

    renderCookingOptions();

    updateBookingPrice();

}


function selectCookingCuisine(value) {

    state.cooking.cuisine =
        value;

    renderCookingOptions();

    updateBookingPrice();

}


function selectCookingPreference(value) {

    state.cooking.preference =
        value;

    renderCookingOptions();

    updateBookingPrice();

}


function selectCookingPeople(value) {

    state.cooking.people =
        value;

    renderCookingOptions();

    updateBookingPrice();

}


function getCookingLabel(
    choiceKey,
    value
) {

    const choice =
        cookingChoices[choiceKey]
            .find(
                item =>
                    item.value === value
            );

    return choice
        ? choice.label
        : value;

}


function calculateCookingPrice() {

    let price = 399;


    const mealAddons = {

        breakfast: 0,

        lunch: 50,

        dinner: 50,

        "full-day": 600

    };


    const peopleAddons = {

        "1-2": 0,

        "3-4": 100,

        "5-6": 200,

        "7+": 350

    };


    const cuisineAddons = {

        "south-indian": 0,

        "north-indian": 0,

        "multi-cuisine": 100,

        custom: 150

    };


    price +=
        mealAddons[
            state.cooking.meal
        ] || 0;


    price +=
        peopleAddons[
            state.cooking.people
        ] || 0;


    price +=
        cuisineAddons[
            state.cooking.cuisine
        ] || 0;


    return price;

}


function getCookingInstructions() {

    const input =
        document.getElementById(
            "cookingInstructions"
        );

    return input
        ? input.value.trim()
        : "";

}


/* =========================================================
   DURATION
========================================================= */


function renderDurations() {

    const container =
        document.getElementById(
            "durationOptions"
        );

    if (!container) return;


    const durations = [
        1,
        2,
        3,
        4
    ];


    container.innerHTML =
        durations.map(hours => {

            return `
                <button
                    type="button"
                    class="option-btn ${
                        state.duration === hours
                            ? "active"
                            : ""
                    }"
                    onclick="selectDuration(${hours})"
                >

                    <strong>
                        ${hours}
                        ${
                            hours === 1
                                ? "Hour"
                                : "Hours"
                        }
                    </strong>

                    <span>
                        ₹${calculatePrice(
                            hours
                        ).toLocaleString("en-IN")}
                    </span>

                </button>
            `;

        }).join("");

}


function selectDuration(hours) {

    state.duration =
        Number(hours);

    renderDurations();

    updateBookingPrice();

}


/* =========================================================
   DATE
========================================================= */


function prepareDates() {

    const container =
        document.getElementById(
            "dateOptions"
        );

    if (!container) return;


    const dates = [];


    for (
        let i = 0;
        i < 5;
        i++
    ) {

        const date =
            new Date();

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
                    type="button"
                    class="date-btn ${
                        state.date === date.iso
                            ? "active"
                            : ""
                    }"
                    onclick="selectDate('${escapeHtml(date.iso)}')"
                >

                    <strong>
                        ${escapeHtml(
                            date.weekday
                        )}
                    </strong>

                    <span>
                        ${date.day}
                        ${escapeHtml(
                            date.month
                        )}
                    </span>

                </button>
            `;

        }).join("");

}


function selectDate(date) {

    state.date =
        date;

    prepareDates();

    renderTimes();

}

/* =========================================================
   TIME
========================================================= */


function renderTimes() {

    const container =
        document.getElementById(
            "timeOptions"
        );

    if (!container) return;


    const times = [
        "9:00 AM",
        "11:00 AM",
        "1:00 PM",
        "3:00 PM",
        "5:00 PM",
        "7:00 PM"
    ];


    if (!state.time) {

        state.time =
            times[0];

    }


    container.innerHTML =
        times.map(time => {

            return `
                <button
                    type="button"
                    class="time-btn ${
                        state.time === time
                            ? "active"
                            : ""
                    }"
                    onclick="selectTime('${escapeHtml(time)}')"
                >
                    ${escapeHtml(time)}
                </button>
            `;

        }).join("");

}


function selectTime(time) {

    state.time =
        time;

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


    if (
        state.service.id ===
        "cooking"
    ) {

        return calculateCookingPrice();

    }


    return (
        Number(
            state.service.basePrice || 0
        ) *
        Number(hours || 1)
    );

}


function updateBookingPrice() {

    const price =
        document.getElementById(
            "bookingPrice"
        );

    if (!price) return;


    price.textContent =
        `₹${calculatePrice().toLocaleString("en-IN")}`;

}


/* =========================================================
   ADDRESS
========================================================= */


async function continueToAddress() {

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


    if (
        state.service.id ===
        "cooking"
    ) {

        state.cooking.instructions =
            getCookingInstructions();

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


    resetAddressForm();

    await loadSavedAddresses();


    document
        .getElementById(
            "addressModal"
        )
        ?.classList.add("active");

}


function resetAddressForm() {

    state.address = "";

    state.addressLocation = null;

    state.selectedAddressId = "";


    [
        "addressLine1",
        "addressLine2",
        "addressPin",
        "addressLandmark",
        "addressLabel"
    ].forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {

            element.value = "";

        }

    });


    const city =
        document.getElementById(
            "addressCity"
        );

    if (city) {

        city.value =
            "Bengaluru";

    }


    const save =
        document.getElementById(
            "saveAddressCheckbox"
        );

    if (save) {

        save.checked =
            false;

    }


    document
        .getElementById(
            "saveAddressLabelWrap"
        )
        ?.setAttribute(
            "hidden",
            ""
        );


    const heading =
        document.getElementById(
            "newAddressHeading"
        );

    if (heading) {

        heading.textContent =
            "Add service address";

    }


    setLocationStatus(
        "We’ll attach your location to this booking."
    );

}


function setLocationStatus(
    message,
    success = false
) {

    const element =
        document.getElementById(
            "locationDetectStatus"
        );

    if (!element) return;


    element.textContent =
        message;


    element.classList.toggle(
        "success",
        success
    );

}


function getSavedAddresses() {

    const cached =
        localStorage.getItem(
            "dorestSavedAddresses"
        );


    try {

        return (
            JSON.parse(cached) ||
            []
        );

    } catch {

        return [];

    }

}


async function loadSavedAddresses() {

    const section =
        document.getElementById(
            "savedAddressesSection"
        );

    const list =
        document.getElementById(
            "savedAddressesList"
        );


    if (!section || !list) {

        return;

    }


    let addresses =
        getSavedAddresses();


    const user =
        window.dorestFirebaseUser;


    if (
        user &&
        window.dorestDb
    ) {

        try {

            const doc =
                await window.dorestDb
                    .collection("customers")
                    .doc(user.uid)
                    .get();


            const data =
                doc.exists
                    ? doc.data()
                    : {};


            if (
                Array.isArray(
                    data.addresses
                )
            ) {

                addresses =
                    data.addresses;


                localStorage.setItem(
                    "dorestSavedAddresses",
                    JSON.stringify(
                        addresses
                    )
                );

            }

        } catch (error) {

            console.warn(
                "Saved address load failed:",
                error
            );

        }

    }


    section.hidden =
        addresses.length === 0;


    list.innerHTML =
        addresses.map(address => {

            return `
                <button
                    type="button"
                    class="saved-address-card"
                    onclick="selectSavedAddress('${escapeHtml(address.id)}')"
                >

                    <span class="saved-address-icon">
                        ${
                            address.label === "Work"
                                ? "💼"
                                : "🏠"
                        }
                    </span>

                    <span class="saved-address-copy">

                        <strong>
                            ${escapeHtml(
                                address.label ||
                                "Saved address"
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                address.fullAddress ||
                                "Address"
                            )}
                        </small>

                    </span>

                    <span class="saved-address-arrow">
                        →
                    </span>

                </button>
            `;

        }).join("");

}


async function selectSavedAddress(
    addressId
) {

    const addresses =
        getSavedAddresses();


    const address =
        addresses.find(
            item =>
                item.id === addressId
        );


    if (!address) return;


    state.selectedAddressId =
        address.id;


    state.address =
        address.fullAddress || "";


    state.addressLocation =
        address.location || null;


    document.getElementById(
        "addressLine1"
    ).value =
        address.line1 || "";


    document.getElementById(
        "addressLine2"
    ).value =
        address.line2 || "";


    document.getElementById(
        "addressCity"
    ).value =
        address.city ||
        "Bengaluru";


    document.getElementById(
        "addressPin"
    ).value =
        address.pin || "";


    document.getElementById(
        "addressLandmark"
    ).value =
        address.landmark || "";


    document.getElementById(
        "addressLabel"
    ).value =
        address.label || "Home";


    document.getElementById(
        "saveAddressCheckbox"
    ).checked =
        false;


    document.getElementById(
        "saveAddressLabelWrap"
    ).hidden =
        true;


    document.getElementById(
        "newAddressHeading"
    ).textContent =
        `Using ${
            address.label ||
            "saved address"
        }`;


    setLocationStatus(
        address.location
            ? "Saved location attached to this address."
            : "Saved address selected.",
        true
    );


    showToast(
        `${
            address.label ||
            "Address"
        } selected.`
    );

}


function startNewAddress() {

    resetAddressForm();


    const section =
        document.getElementById(
            "savedAddressesSection"
        );


    if (section) {

        section.hidden =
            getSavedAddresses()
                .length === 0;

    }


    document.getElementById(
        "newAddressHeading"
    ).textContent =
        "Add service address";


    document
        .getElementById(
            "addressLine1"
        )
        ?.focus();

}


function useCurrentLocation() {

    if (
        !navigator.geolocation
    ) {

        setLocationStatus(
            "Location is not supported by this browser."
        );

        return;

    }


    setLocationStatus(
        "Getting your current location…"
    );


    navigator.geolocation.getCurrentPosition(

        position => {

            state.addressLocation = {

                latitude:
                    Number(
                        position.coords.latitude
                    ).toFixed(6),

                longitude:
                    Number(
                        position.coords.longitude
                    ).toFixed(6),

                accuracy:
                    Math.round(
                        position.coords.accuracy ||
                        0
                    )

            };


            setLocationStatus(
                `Location captured • ±${
                    state.addressLocation.accuracy
                }m accuracy`,
                true
            );


            showToast(
                "Current location captured."
            );

        },

        error => {

            console.warn(
                "Geolocation failed:",
                error
            );


            setLocationStatus(
                "Couldn’t access your location. Please allow location permission."
            );


            showToast(
                "Please allow location access and try again."
            );

        },

        {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 60000
        }

    );

}


async function saveAddressToCustomer(
    address
) {

    const user =
        window.dorestFirebaseUser;


    if (!user) {

        const local =
            getSavedAddresses();


        local.unshift(
            address
        );


        localStorage.setItem(
            "dorestSavedAddresses",
            JSON.stringify(
                local.slice(0, 10)
            )
        );


        return;

    }


    if (!window.dorestDb) {

        throw new Error(
            "Firestore is not available."
        );

    }


    const customerRef =
        window.dorestDb
            .collection("customers")
            .doc(user.uid);


    const snapshot =
        await customerRef.get();


    const current =
        snapshot.exists &&
        Array.isArray(
            snapshot.data().addresses
        )
            ? snapshot.data().addresses
            : [];


    const updated = [

        address,

        ...current.filter(
            item =>
                item.id !==
                address.id
        )

    ].slice(0, 10);


    await customerRef.set(

        {

            uid: user.uid,

            addresses:
                updated,

            updatedAt:
                firebase.firestore
                    .FieldValue
                    .serverTimestamp()

        },

        {
            merge: true
        }

    );


    localStorage.setItem(
        "dorestSavedAddresses",
        JSON.stringify(
            updated
        )
    );

}


function buildAddressFromForm() {

    const line1 =
        document.getElementById(
            "addressLine1"
        ).value.trim();


    const line2 =
        document.getElementById(
            "addressLine2"
        ).value.trim();


    const city =
        document.getElementById(
            "addressCity"
        ).value.trim();


    const pin =
        document.getElementById(
            "addressPin"
        ).value.trim();


    const landmark =
        document.getElementById(
            "addressLandmark"
        ).value.trim();


    if (
        !line1 ||
        !line2 ||
        !city ||
        !/^\d{6}$/.test(pin)
    ) {

        return null;

    }


    const parts = [

        line1,

        line2,

        city,

        pin,

        landmark
            ? `Near ${landmark}`
            : ""

    ].filter(Boolean);


    return {

        line1,

        line2,

        city,

        pin,

        landmark,

        fullAddress:
            parts.join(", "),

        location:
            state.addressLocation ||
            null

    };

}


/* =========================================================
   REVIEW BOOKING
========================================================= */


async function reviewBooking() {

    const addressData =
        buildAddressFromForm();


    if (!addressData) {

        showToast(
            "Please enter a valid 6-digit pincode and complete your address."
        );

        return;

    }


    state.address =
        addressData.fullAddress;


    const saveCheckbox =
        document.getElementById(
            "saveAddressCheckbox"
        );


    if (
        saveCheckbox?.checked &&
        !state.selectedAddressId
    ) {

        addressData.id =
            `ADDR-${Date.now()}`;


        addressData.label =
            document.getElementById(
                "addressLabel"
            ).value.trim() ||
            "Home";


        try {

            await saveAddressToCustomer(
                addressData
            );


            showToast(
                "Address saved for future bookings."
            );

        } catch (error) {

            console.error(
                "Address save failed:",
                error
            );


            showToast(
                "Address used for this booking, but could not be saved."
            );

        }

    }


    const fullAddress =
        addressData.fullAddress;


    document.getElementById(
        "reviewService"
    ).textContent =
        state.service.name;


    const reviewDurationRow =
        document.getElementById(
            "reviewDuration"
        )?.closest(
            ".review-row"
        );


    if (
        state.service.id ===
        "cooking"
    ) {

        if (reviewDurationRow) {

            reviewDurationRow.style.display =
                "none";

        }

    } else {

        if (reviewDurationRow) {

            reviewDurationRow.style.display =
                "";

        }


        document.getElementById(
            "reviewDuration"
        ).textContent =
            `${state.duration} ${
                state.duration === 1
                    ? "Hour"
                    : "Hours"
            }`;

    }


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


    const cookingReviewCard =
        document.getElementById(
            "cookingReviewCard"
        );


    if (
        state.service.id ===
        "cooking"
    ) {

        cookingReviewCard.hidden =
            false;


        document.getElementById(
            "reviewCookingType"
        ).textContent =
            getCookingLabel(
                "type",
                state.cooking.type
            );


        document.getElementById(
            "reviewCookingMeal"
        ).textContent =
            getCookingLabel(
                "meal",
                state.cooking.meal
            );


        document.getElementById(
            "reviewCookingCuisine"
        ).textContent =
            getCookingLabel(
                "cuisine",
                state.cooking.cuisine
            );


        document.getElementById(
            "reviewCookingPreference"
        ).textContent =
            getCookingLabel(
                "preference",
                state.cooking.preference
            );


        document.getElementById(
            "reviewCookingPeople"
        ).textContent =
            getCookingLabel(
                "people",
                state.cooking.people
            );


        document.getElementById(
            "reviewCookingInstructions"
        ).textContent =
            state.cooking.instructions ||
            "No special instructions";

    } else {

        cookingReviewCard.hidden =
            true;

    }


    document.getElementById(
        "reviewTotal"
    ).textContent =
        `₹${calculatePrice().toLocaleString("en-IN")}`;


    document
        .getElementById(
            "addressModal"
        )
        .classList.remove(
            "active"
        );


    document
        .getElementById(
            "reviewModal"
        )
        .classList.add(
            "active"
        );

}


/* =========================================================
   CONFIRM BOOKING
========================================================= */


async function confirmBooking() {

    const confirmButton =
        document.getElementById(
            "confirmBookingBtn"
        );


    try {

        if (!window.dorestAuth) {

            throw new Error(
                "Firebase Authentication is not initialized."
            );

        }


        const currentUser =
            await new Promise(
                resolve => {

                    const unsubscribe =
                        window.dorestAuth
                            .onAuthStateChanged(
                                user => {

                                    unsubscribe();

                                    resolve(
                                        user
                                    );

                                }
                            );

                }
            );


        if (!currentUser) {

            showToast(
                "Please login before confirming your booking."
            );

            openCustomerAccount?.();

            return;

        }


        if (
            !state.service ||
            !state.date ||
            !state.time
        ) {

            showToast(
                "Please complete your service, date and time."
            );

            return;

        }


        if (!window.dorestDb) {

            throw new Error(
                "Firestore is not initialized."
            );

        }


        if (confirmButton) {

            confirmButton.disabled =
                true;

            confirmButton.textContent =
                "Confirming booking...";

        }


        const bookingId =
            `DR-${Date.now()
                .toString()
                .slice(-10)}-${Math.floor(
                    100 +
                    Math.random() *
                    900
                )}`;


        const total =
            Number(
                calculatePrice() ||
                0
            );


        const profile =
            getProfile();


        const booking = {

            id:
                bookingId,

            uid:
                currentUser.uid,

            serviceId:
                state.service.id,

            serviceName:
                state.service.name,

            icon:
                state.service.icon ||
                "🛠️",

            date:
                state.date,

            time:
                state.time,

            duration:
                Number(
                    state.duration ||
                    1
                ),

            total,

            status:
                "pending",

            address:
                state.address ||
                profile.address ||
                "Service address",

            addressLocation:
                state.addressLocation ||
                null,

            cooking:
                state.service.id ===
                "cooking"
                    ? {

                        type:
                            getCookingLabel(
                                "type",
                                state.cooking.type
                            ),

                        meal:
                            getCookingLabel(
                                "meal",
                                state.cooking.meal
                            ),

                        cuisine:
                            getCookingLabel(
                                "cuisine",
                                state.cooking.cuisine
                            ),

                        preference:
                            getCookingLabel(
                                "preference",
                                state.cooking.preference
                            ),

                        people:
                            getCookingLabel(
                                "people",
                                state.cooking.people
                            ),

                        instructions:
                            state.cooking.instructions ||
                            ""

                    }
                    : null,

            createdAt:
                firebase.firestore
                    .FieldValue
                    .serverTimestamp()

        };


        await window.dorestDb
            .collection("bookings")
            .doc(bookingId)
            .set(booking);


        const localBookings =
            getBookings();


        localBookings.unshift({

            ...booking,

            createdAt:
                Date.now()

        });


        localStorage.setItem(
            "dorestBookings",
            JSON.stringify(
                localBookings
            )
        );


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
            `₹${total.toLocaleString(
                "en-IN"
            )}`;


        document.getElementById(
            "reviewModal"
        ).classList.remove(
            "active"
        );


        document.getElementById(
            "confirmationModal"
        ).classList.add(
            "active"
        );


        showToast(
            "Booking confirmed successfully."
        );


    } catch (error) {

        console.error(
            "DoRest CONFIRM BOOKING ERROR:",
            error
        );


        let message =
            "Booking could not be confirmed.";


        if (
            error?.code ===
            "permission-denied"
        ) {

            message =
                "Booking permission denied. Please check Firestore rules.";

        } else if (
            error?.code ===
            "failed-precondition"
        ) {

            message =
                "Firestore is not ready. Please check your Firebase database setup.";

        } else if (
            error?.code ===
            "unavailable"
        ) {

            message =
                "Firebase is temporarily unavailable. Please try again.";

        } else if (
            error?.message
        ) {

            message =
                `Booking failed: ${error.message}`;

        }


        showToast(message);


    } finally {

        if (confirmButton) {

            confirmButton.disabled =
                false;

            confirmButton.textContent =
                "Confirm booking";

        }

    }

}


window.reviewBooking =
    reviewBooking;


window.confirmBooking =
    confirmBooking;


/* =========================================================
   CLOSE BOOKING MODALS
========================================================= */


function closeBookingModal() {

    document
        .getElementById(
            "bookingModal"
        )
        ?.classList.remove(
            "active"
        );

}


function closeAddressModal() {

    document
        .getElementById(
            "addressModal"
        )
        ?.classList.remove(
            "active"
        );

}


function closeReviewModal() {

    document
        .getElementById(
            "reviewModal"
        )
        ?.classList.remove(
            "active"
        );

}


function closeConfirmation() {

    document
        .getElementById(
            "confirmationModal"
        )
        ?.classList.remove(
            "active"
        );

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
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


function formatReadableDate(
    dateString
) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(
            `${dateString}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }


    return date.toLocaleDateString(
        "en-IN",
        {

            weekday:
                "short",

            day:
                "numeric",

            month:
                "short",

            year:
                "numeric"

        }
    );

}


/* =========================================================
   MOBILE MENU
========================================================= */


function toggleMobileMenu() {

    document
        .getElementById(
            "mobileMenu"
        )
        ?.classList.toggle(
            "active"
        );

}


function closeMobileMenu() {

    document
        .getElementById(
            "mobileMenu"
        )
        ?.classList.remove(
            "active"
        );

}


/* =========================================================
   HOME
========================================================= */


function goHome() {

    window.scrollTo({

        top: 0,

        behavior:
            "smooth"

    });

}


/* =========================================================
   TOAST
========================================================= */


function showToast(
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) return;


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.toastTimer
    );


    window.toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2600
        );

}


/* =========================================================
   CLOSE MODALS OUTSIDE
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


/* =========================================================
   CUSTOMER ACCOUNT
========================================================= */


function getProfile() {

    try {

        return (
            JSON.parse(
                localStorage.getItem(
                    "dorestProfile"
                )
            ) || {

                name: "",

                phone: "",

                email: "",

                address: ""

            }
        );

    } catch {

        return {

            name: "",

            phone: "",

            email: "",

            address: ""

        };

    }

}


window.getProfile =
    getProfile;


function getBookings() {

    try {

        return (
            JSON.parse(
                localStorage.getItem(
                    "dorestBookings"
                )
            ) || []
        );

    } catch {

        return [];

    }

}


function openAccount() {

    const profile =
        getProfile();


    document.getElementById(
        "profileName"
    ).value =
        profile.name || "";


    document.getElementById(
        "profilePhone"
    ).value =
        profile.phone || "";


    document.getElementById(
        "profileEmail"
    ).value =
        profile.email || "";


    document.getElementById(
        "profileAddress"
    ).value =
        profile.address || "";


    updateAccountHeader(
        profile
    );


    const accountLogoutButtons =
        document.querySelectorAll(
            ".logout-account-top-btn, .logout-account-btn"
        );


    accountLogoutButtons.forEach(
        button => {

            button.style.display =
                "block";

        }
    );


    switchAccountTab(
        "profile"
    );


    document
        .getElementById(
            "accountModal"
        )
        ?.classList.add(
            "active"
        );

}


function closeAccount() {

    document
        .getElementById(
            "accountModal"
        )
        ?.classList.remove(
            "active"
        );

}


function updateAccountHeader(
    profile
) {

    const name =
        profile.name ||
        "Welcome to DoRest";


    const title =
        document.getElementById(
            "accountTitle"
        );


    if (title) {

        title.textContent =
            profile.name
                ? `Hi, ${profile.name}`
                : name;

    }


    const subtitle =
        document.getElementById(
            "accountSubtitle"
        );


    if (subtitle) {

        subtitle.textContent =
            profile.name
                ? "Manage your profile and bookings."
                : "Add your details to make booking faster.";

    }


    const avatar =
        document.getElementById(
            "accountAvatar"
        );


    if (avatar) {

        avatar.textContent =
            profile.name
                ? profile.name
                    .trim()
                    .charAt(0)
                    .toUpperCase()
                : "D";

    }


    const headerButton =
        document.getElementById(
            "accountHeaderBtn"
        ) ||
        document.querySelector(
            ".login-btn"
        );


    const logoutButton =
        document.getElementById(
            "logoutHeaderBtn"
        );


    const isLoggedIn =
        !!(
            window.dorestFirebaseUser ||
            window.dorestAuth?.currentUser
        );


    if (headerButton) {

        headerButton.textContent =
            isLoggedIn
                ? "My Account"
                : "Login";

    }


    if (logoutButton) {

        logoutButton.style.display =
            isLoggedIn
                ? "inline-flex"
                : "none";

    }

}


window.updateAccountHeader =
    updateAccountHeader;


async function saveProfile() {

    const profile = {

        name:
            document.getElementById(
                "profileName"
            ).value.trim(),

        phone:
            document.getElementById(
                "profilePhone"
            ).value.trim(),

        email:
            document.getElementById(
                "profileEmail"
            ).value.trim(),

        address:
            document.getElementById(
                "profileAddress"
            ).value.trim()

    };


    if (!profile.name) {

        showToast(
            "Please enter your name."
        );

        return;

    }


    if (
        profile.phone &&
        !/^\d{10}$/.test(
            profile.phone.replace(
                /\D/g,
                ""
            )
        )
    ) {

        showToast(
            "Please enter a valid 10-digit mobile number."
        );

        return;

    }


    const currentUser =
        window.dorestFirebaseUser ||
        null;


    localStorage.setItem(
        "dorestProfile",
        JSON.stringify(
            profile
        )
    );


    updateAccountHeader(
        profile
    );


    if (
        currentUser &&
        window.dorestDb
    ) {

        try {

            await window.dorestDb
                .collection(
                    "customers"
                )
                .doc(
                    currentUser.uid
                )
                .set(

                    {

                        uid:
                            currentUser.uid,

                        ...profile,

                        updatedAt:
                            firebase.firestore
                                .FieldValue
                                .serverTimestamp()

                    },

                    {
                        merge: true
                    }

                );


            showToast(
                "Profile saved to your DoRest account."
            );


            return;

        } catch (error) {

            console.error(
                "Profile save failed:",
                error
            );


            showToast(
                "Profile saved locally, but cloud sync failed."
            );


            return;

        }

    }


    showToast(
        "Profile saved locally. Login to sync it to your account."
    );

}


function switchAccountTab(
    tab
) {

    const profilePanel =
        document.getElementById(
            "profilePanel"
        );


    const bookingsPanel =
        document.getElementById(
            "bookingsPanel"
        );


    const profileTab =
        document.getElementById(
            "profileTab"
        );


    const bookingsTab =
        document.getElementById(
            "bookingsTab"
        );


    const isProfile =
        tab === "profile";


    if (profilePanel) {

        profilePanel.hidden =
            !isProfile;

    }


    if (bookingsPanel) {

        bookingsPanel.hidden =
            isProfile;

    }


    if (profileTab) {

        profileTab.classList.toggle(
            "active",
            isProfile
        );

    }


    if (bookingsTab) {

        bookingsTab.classList.toggle(
            "active",
            !isProfile
        );

    }


    if (!isProfile) {

        renderBookings(
            "all"
        );

        loadBookingsFromFirestore();

    }

}


function filterBookings(
    filter,
    button
) {

    window.currentBookingFilter =
        filter;


    document
        .querySelectorAll(
            ".booking-filter"
        )
        .forEach(
            btn => {

                btn.classList.remove(
                    "active"
                );

            }
        );


    if (button) {

        button.classList.add(
            "active"
        );

    }


    renderBookings(
        filter
    );

}


/* =========================================================
   LOAD CUSTOMER BOOKINGS
========================================================= */


async function loadBookingsFromFirestore() {

    const currentUser =
        window.dorestFirebaseUser ||
        null;


    if (
        !currentUser ||
        !window.dorestDb
    ) {

        return [];

    }


    try {

        const snapshot =
            await window.dorestDb
                .collection(
                    "bookings"
                )
                .where(
                    "uid",
                    "==",
                    currentUser.uid
                )
                .get();


        const bookings =
            snapshot.docs.map(
                doc => {

                    const data =
                        doc.data();


                    return {

                        id:
                            doc.id,

                        ...data,

                        createdAt:
                            data.createdAt
                                ?.toMillis?.() ||
                            data.createdAt ||
                            0

                    };

                }
            );


        bookings.sort(
            (a, b) =>
                Number(
                    b.createdAt || 0
                ) -
                Number(
                    a.createdAt || 0
                )
        );


        localStorage.setItem(
            "dorestBookings",
            JSON.stringify(
                bookings
            )
        );


        renderBookings(
            window.currentBookingFilter ||
            "all"
        );


        return bookings;


    } catch (error) {

        console.error(
            "Firestore bookings load failed:",
            error
        );


        showToast(
            "Couldn't refresh cloud bookings."
        );


        return getBookings();

    }

}


window.loadBookingsFromFirestore =
    loadBookingsFromFirestore;


/* =========================================================
   RENDER BOOKINGS
========================================================= */


function renderBookings(
    filter = "all"
) {

    window.currentBookingFilter =
        filter;


    const container =
        document.getElementById(
            "bookingsList"
        );


    if (!container) return;


    let bookings =
        getBookings();


    if (!bookings.length) {

        container.innerHTML = `

            <div class="booking-empty">

                <strong>
                    No bookings yet
                </strong>

                <span>
                    Your confirmed DoRest bookings will appear here.
                </span>

            </div>

        `;

        return;

    }


    /*
     * IMPORTANT:
     * Normalize status before filtering.
     * Firestore / old local bookings may contain
     * "Pending", "pending", "UPCOMING", etc.
     */

    if (filter !== "all") {

        const normalizedFilter =
            String(
                filter
            )
                .trim()
                .toLowerCase();


        bookings =
            bookings.filter(
                booking =>
                    String(
                        booking.status ||
                        "upcoming"
                    )
                        .trim()
                        .toLowerCase() ===
                    normalizedFilter
            );

    }


    if (!bookings.length) {

        container.innerHTML = `

            <div class="booking-empty">

                <strong>
                    No ${escapeHtml(
                        filter
                    )} bookings
                </strong>

                <span>
                    Try another booking category.
                </span>

            </div>

        `;

        return;

    }


    container.innerHTML =
        bookings.map(
            booking => {

                const status =
                    String(
                        booking.status ||
                        "upcoming"
                    )
                        .trim()
                        .toLowerCase();


                const statusLabel =
                    status.charAt(0)
                        .toUpperCase() +
                    status.slice(1);


                return `

                    <div
                        class="booking-card"
                        data-booking-id="${escapeHtml(
                            booking.id
                        )}"
                        style="cursor:pointer"
                    >

                        <div class="booking-card-top">

                            <div class="booking-service">

                                <div class="booking-service-icon">
                                    ${
                                        booking.icon ||
                                        "🏠"
                                    }
                                </div>

                                <div>

                                    <strong>
                                        ${escapeHtml(
                                            booking.serviceName
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHtml(
                                            booking.id
                                        )}
                                    </span>

                                </div>

                            </div>


                            <span
                                class="booking-status ${escapeHtml(
                                    status
                                )}"
                            >
                                ${escapeHtml(
                                    statusLabel
                                )}
                            </span>

                        </div>


                        <div class="booking-card-bottom">

                            <div class="booking-meta">

                                ${formatReadableDate(
                                    booking.date
                                )}

                                •

                                ${escapeHtml(
                                    booking.time ||
                                    ""
                                )}

                            </div>


                            <div class="booking-price">

                                ₹${Number(
                                    booking.total ||
                                    0
                                ).toLocaleString(
                                    "en-IN"
                                )}

                            </div>

                        </div>

                    </div>

                `;

            }
        ).join("");

}


/* =========================================================
   HTML ESCAPE
========================================================= */


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   ACCOUNT INIT
========================================================= */


window.addEventListener(
    "DOMContentLoaded",
    () => {

        updateAccountHeader(
            getProfile()
        );

    }
);

/* =========================================================
   BOOKING DETAILS
========================================================= */


/*
 * IMPORTANT:
 * Event delegation is used here because booking cards are
 * dynamically created by renderBookings().
 *
 * This means clicking anywhere on a booking card will open
 * the correct booking details even after the list is refreshed.
 */

document.addEventListener(
    "click",
    event => {

        const card =
            event.target.closest(
                ".booking-card"
            );


        if (!card) {

            return;

        }


        /*
         * Do not trigger booking details when the user
         * clicks an actual button/link inside the card.
         */

        if (
            event.target.closest(
                "button, a, input, select, textarea"
            )
        ) {

            return;

        }


        const bookingId =
            card.getAttribute(
                "data-booking-id"
            );


        if (!bookingId) {

            console.warn(
                "Booking card has no booking ID."
            );

            return;

        }


        openBookingDetails(
            bookingId
        );

    }
);


/* =========================================================
   OPEN BOOKING DETAILS
========================================================= */


async function openBookingDetails(
    bookingId
) {

    /*
     * First try local bookings.
     */

    let booking =
        getBookings().find(
            item =>
                String(item.id) ===
                String(bookingId)
        );


    /*
     * If the booking isn't available locally,
     * try Firestore.
     */

    if (
        !booking &&
        window.dorestDb &&
        window.dorestFirebaseUser
    ) {

        try {

            const doc =
                await window.dorestDb
                    .collection(
                        "bookings"
                    )
                    .doc(
                        bookingId
                    )
                    .get();


            if (doc.exists) {

                booking = {

                    id:
                        doc.id,

                    ...doc.data()

                };

            }

        } catch (error) {

            console.error(
                "Booking details load failed:",
                error
            );

        }

    }


    if (!booking) {

        showToast(
            "Booking not found."
        );

        return;

    }


    const content =
        document.getElementById(
            "bookingDetailsContent"
        );


    const modal =
        document.getElementById(
            "bookingDetailsModal"
        );


    if (!content || !modal) {

        console.error(
            "Booking details modal elements were not found in index.html."
        );

        showToast(
            "Booking details could not be opened."
        );

        return;

    }


    /*
     * Normalize status so old and new bookings
     * behave consistently.
     */

    const status =
        String(
            booking.status ||
            "upcoming"
        )
            .trim()
            .toLowerCase();


    const statusLabel =
        status.charAt(0)
            .toUpperCase() +
        status.slice(1);


    /* =====================================================
       COOKING DETAILS
    ===================================================== */


    let cookingHtml = "";


    if (
        booking.serviceId ===
            "cooking" &&
        booking.cooking
    ) {

        cookingHtml = `

            <div class="details-section">

                <div class="details-section-title">
                    Cooking preferences
                </div>


                <div class="details-row">

                    <span>
                        Type
                    </span>

                    <strong>
                        ${escapeHtml(
                            booking.cooking.type ||
                            ""
                        )}
                    </strong>

                </div>


                <div class="details-row">

                    <span>
                        Meals
                    </span>

                    <strong>
                        ${escapeHtml(
                            booking.cooking.meal ||
                            ""
                        )}
                    </strong>

                </div>


                <div class="details-row">

                    <span>
                        Cuisine
                    </span>

                    <strong>
                        ${escapeHtml(
                            booking.cooking.cuisine ||
                            ""
                        )}
                    </strong>

                </div>


                <div class="details-row">

                    <span>
                        Preference
                    </span>

                    <strong>
                        ${escapeHtml(
                            booking.cooking.preference ||
                            ""
                        )}
                    </strong>

                </div>


                <div class="details-row">

                    <span>
                        People
                    </span>

                    <strong>
                        ${escapeHtml(
                            booking.cooking.people ||
                            ""
                        )}
                    </strong>

                </div>


                ${
                    booking.cooking.instructions
                        ? `

                            <div class="details-row">

                                <span>
                                    Instructions
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        booking.cooking.instructions
                                    )}
                                </strong>

                            </div>

                        `
                        : ""
                }

            </div>

        `;

    }


    /* =====================================================
       PARTNER DETAILS
    ===================================================== */


    let partnerHtml = "";


    if (
        booking.partnerName ||
        booking.partnerId
    ) {

        partnerHtml = `

            <div class="details-section">

                <div class="details-section-title">
                    Service professional
                </div>


                <div class="details-row">

                    <span>
                        Partner
                    </span>

                    <strong>
                        ${escapeHtml(
                            booking.partnerName ||
                            "Assigned professional"
                        )}
                    </strong>

                </div>


                ${
                    booking.partnerService
                        ? `

                            <div class="details-row">

                                <span>
                                    Service
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        booking.partnerService
                                    )}
                                </strong>

                            </div>

                        `
                        : ""
                }

            </div>

        `;

    }


    /* =====================================================
       MODIFY BOOKING
    ===================================================== */


    /*
     * Pending and upcoming bookings can be modified.
     *
     * Accepted/assigned/completed/rejected/cancelled
     * bookings do not show those controls.
     */

    const canModify =
        status === "upcoming" ||
        status === "pending";


    /* =====================================================
       DETAILS HTML
    ===================================================== */


    content.innerHTML = `

        <div class="details-header">

            <div class="details-icon">

                ${
                    booking.icon ||
                    "🏠"
                }

            </div>


            <div>

                <h2>
                    ${escapeHtml(
                        booking.serviceName ||
                        "DoRest Service"
                    )}
                </h2>


                <p>
                    ${escapeHtml(
                        booking.id
                    )}
                </p>

            </div>


            <span
                class="booking-status ${escapeHtml(
                    status
                )} details-status"
            >

                ${escapeHtml(
                    statusLabel
                )}

            </span>

        </div>


        <div class="details-info-grid">

            <div class="details-info-item">

                <span>
                    Date
                </span>

                <strong>
                    ${formatReadableDate(
                        booking.date
                    )}
                </strong>

            </div>


            <div class="details-info-item">

                <span>
                    Time
                </span>

                <strong>
                    ${escapeHtml(
                        booking.time ||
                        ""
                    )}
                </strong>

            </div>


            <div class="details-info-item full">

                <span>
                    Service address
                </span>

                <strong>
                    ${escapeHtml(
                        booking.address ||
                        "Address not provided"
                    )}
                </strong>

            </div>

        </div>


        ${cookingHtml}


        ${partnerHtml}


        <div class="details-section">

            <div class="details-section-title">
                Price breakdown
            </div>


            <div class="details-row">

                <span>
                    Service
                </span>

                <strong>
                    ₹${Number(
                        booking.total ||
                        0
                    ).toLocaleString(
                        "en-IN"
                    )}
                </strong>

            </div>


            <div class="details-row details-total">

                <span>
                    Total
                </span>

                <strong>
                    ₹${Number(
                        booking.total ||
                        0
                    ).toLocaleString(
                        "en-IN"
                    )}
                </strong>

            </div>

        </div>


        ${
            canModify
                ? `

                    <div class="details-actions">

                        <button
                            type="button"
                            class="details-action-btn primary"
                            onclick="event.stopPropagation(); showReschedulePanel('${escapeHtml(
                                booking.id
                            )}')"
                        >

                            Reschedule

                        </button>


                        <button
                            type="button"
                            class="details-action-btn danger"
                            onclick="event.stopPropagation(); showCancelPanel('${escapeHtml(
                                booking.id
                            )}')"
                        >

                            Cancel booking

                        </button>

                    </div>

                `
                : ""
        }

    `;


    /*
     * Open modal AFTER content has been inserted.
     */

    modal.classList.add(
        "active"
    );


    /*
     * Make sure the modal is visible even if some older
     * CSS uses display/visibility rules.
     */

    modal.style.display =
        "flex";


    document.body.classList.add(
        "modal-open"
    );

}


/* =========================================================
   CLOSE BOOKING DETAILS
========================================================= */


function closeBookingDetails() {

    const modal =
        document.getElementById(
            "bookingDetailsModal"
        );


    if (!modal) return;


    modal.classList.remove(
        "active"
    );


    modal.style.display =
        "";


    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   RESCHEDULE
========================================================= */


function showReschedulePanel(
    bookingId
) {

    const content =
        document.getElementById(
            "bookingDetailsContent"
        );


    if (!content) return;


    /*
     * Prevent duplicate panel.
     */

    document
        .getElementById(
            "reschedulePanel"
        )
        ?.remove();


    content.insertAdjacentHTML(
        "beforeend",
        `

            <div
                class="reschedule-panel"
                id="reschedulePanel"
            >

                <h3>
                    Choose a new schedule
                </h3>


                <div class="reschedule-grid">

                    <div>

                        <label>
                            Date
                        </label>

                        <input
                            id="rescheduleDate"
                            type="date"
                        >

                    </div>


                    <div>

                        <label>
                            Time
                        </label>

                        <select
                            id="rescheduleTime"
                        >

                            <option>
                                9:00 AM
                            </option>

                            <option>
                                11:00 AM
                            </option>

                            <option>
                                1:00 PM
                            </option>

                            <option>
                                3:00 PM
                            </option>

                            <option>
                                5:00 PM
                            </option>

                            <option>
                                7:00 PM
                            </option>

                        </select>

                    </div>

                </div>


                <button
                    type="button"
                    class="primary-btn full-btn"
                    style="margin-top:10px"
                    onclick="confirmReschedule('${escapeHtml(
                        bookingId
                    )}')"
                >

                    Confirm new schedule

                </button>

            </div>

        `
    );


    const dateInput =
        document.getElementById(
            "rescheduleDate"
        );


    if (dateInput) {

        const tomorrow =
            new Date();


        tomorrow.setDate(
            tomorrow.getDate() + 1
        );


        dateInput.min =
            formatDateKey(
                tomorrow
            );

    }

}


async function confirmReschedule(
    bookingId
) {

    const date =
        document.getElementById(
            "rescheduleDate"
        )?.value;


    const time =
        document.getElementById(
            "rescheduleTime"
        )?.value;


    if (!date || !time) {

        showToast(
            "Please select date and time."
        );

        return;

    }


    const bookings =
        getBookings();


    const booking =
        bookings.find(
            item =>
                String(item.id) ===
                String(bookingId)
        );


    if (!booking) {

        showToast(
            "Booking not found."
        );

        return;

    }


    booking.date =
        date;


    booking.time =
        time;


    localStorage.setItem(
        "dorestBookings",
        JSON.stringify(
            bookings
        )
    );


    if (
        window.dorestDb &&
        window.dorestFirebaseUser
    ) {

        try {

            await window.dorestDb
                .collection(
                    "bookings"
                )
                .doc(
                    bookingId
                )
                .update({

                    date,

                    time,

                    updatedAt:
                        firebase.firestore
                            .FieldValue
                            .serverTimestamp()

                });

        } catch (error) {

            console.error(
                "Reschedule cloud update failed:",
                error
            );


            showToast(
                "Saved locally, but cloud update failed."
            );


            return;

        }

    }


    closeBookingDetails();


    renderBookings(
        "all"
    );


    showToast(
        "Booking rescheduled successfully."
    );

}


/* =========================================================
   CANCEL BOOKING
========================================================= */


function showCancelPanel(
    bookingId
) {

    const content =
        document.getElementById(
            "bookingDetailsContent"
        );


    if (!content) return;


    document
        .getElementById(
            "cancelPanel"
        )
        ?.remove();


    content.insertAdjacentHTML(
        "beforeend",
        `

            <div
                class="cancel-panel"
                id="cancelPanel"
            >

                <h3>
                    Cancel this booking?
                </h3>


                <p class="cancel-warning">

                    This will mark the booking
                    as cancelled. You can book
                    the service again later.

                </p>


                <button
                    type="button"
                    class="details-action-btn danger"
                    style="width:100%;margin-top:10px"
                    onclick="confirmCancelBooking('${escapeHtml(
                        bookingId
                    )}')"
                >

                    Yes, cancel booking

                </button>

            </div>

        `
    );

}


async function confirmCancelBooking(
    bookingId
) {

    const bookings =
        getBookings();


    const booking =
        bookings.find(
            item =>
                String(item.id) ===
                String(bookingId)
        );


    if (!booking) {

        showToast(
            "Booking not found."
        );

        return;

    }


    booking.status =
        "cancelled";


    localStorage.setItem(
        "dorestBookings",
        JSON.stringify(
            bookings
        )
    );


    if (
        window.dorestDb &&
        window.dorestFirebaseUser
    ) {

        try {

            await window.dorestDb
                .collection(
                    "bookings"
                )
                .doc(
                    bookingId
                )
                .update({

                    status:
                        "cancelled",

                    updatedAt:
                        firebase.firestore
                            .FieldValue
                            .serverTimestamp()

                });

        } catch (error) {

            console.error(
                "Cancel cloud update failed:",
                error
            );


            showToast(
                "Saved locally, but cloud update failed."
            );


            return;

        }

    }


    closeBookingDetails();


    renderBookings(
        window.currentBookingFilter ||
        "all"
    );


    showToast(
        "Booking cancelled."
    );

}


/* =========================================================
   EXPOSE BOOKING FUNCTIONS
========================================================= */


/*
 * These are explicitly exposed because some of the
 * HTML uses inline onclick handlers.
 */

window.openBookingDetails =
    openBookingDetails;


window.closeBookingDetails =
    closeBookingDetails;


window.showReschedulePanel =
    showReschedulePanel;


window.confirmReschedule =
    confirmReschedule;


window.showCancelPanel =
    showCancelPanel;


window.confirmCancelBooking =
    confirmCancelBooking;


/* =========================================================
   GENERAL GLOBAL FUNCTIONS
========================================================= */


window.openLocationModal =
    openLocationModal;


window.closeLocationModal =
    closeLocationModal;


window.saveLocation =
    saveLocation;


window.openServiceDetails =
    openServiceDetails;


window.closeServiceDetails =
    closeServiceDetails;


window.openBooking =
    openBooking;


window.closeBookingModal =
    closeBookingModal;


window.closeAddressModal =
    closeAddressModal;


window.closeReviewModal =
    closeReviewModal;


window.closeConfirmation =
    closeConfirmation;


window.selectDuration =
    selectDuration;


window.selectDate =
    selectDate;


window.selectTime =
    selectTime;


window.selectCookingType =
    selectCookingType;


window.selectCookingMeal =
    selectCookingMeal;


window.selectCookingCuisine =
    selectCookingCuisine;


window.selectCookingPreference =
    selectCookingPreference;


window.selectCookingPeople =
    selectCookingPeople;


window.continueToAddress =
    continueToAddress;


window.useCurrentLocation =
    useCurrentLocation;


window.reviewBooking =
    reviewBooking;


window.confirmBooking =
    confirmBooking;


window.selectSavedAddress =
    selectSavedAddress;


window.startNewAddress =
    startNewAddress;


window.openAccount =
    openAccount;


window.closeAccount =
    closeAccount;


window.switchAccountTab =
    switchAccountTab;


window.filterBookings =
    filterBookings;


window.saveProfile =
    saveProfile;


window.filterServices =
    filterServices;


window.resetServiceFilter =
    resetServiceFilter;


window.focusServices =
    focusServices;


window.toggleMobileMenu =
    toggleMobileMenu;


window.closeMobileMenu =
    closeMobileMenu;


window.goHome =
    goHome;


/* =========================================================
   ESCAPE KEY
========================================================= */


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        closeBookingDetails();

        closeServiceDetails();

        closeBookingModal();

        closeAddressModal();

        closeReviewModal();

        closeConfirmation();

        closeLocationModal();

        closeAccount();

        closeMobileMenu();

    }
);


/* =========================================================
   FINAL INITIALIZATION
========================================================= */


document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * Make sure booking functions are available
         * immediately after page load.
         */

        window.openBookingDetails =
            openBookingDetails;


        window.closeBookingDetails =
            closeBookingDetails;


        /*
         * If the account modal exists, make sure the
         * current profile is reflected in its header.
         */

        updateAccountHeader(
            getProfile()
        );


        /*
         * Render cached bookings immediately.
         * Firestore refresh happens separately.
         */

        if (
            document.getElementById(
                "bookingsList"
            )
        ) {

            renderBookings(
                "all"
            );

        }

    }
);