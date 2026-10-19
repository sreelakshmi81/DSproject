
/*
    RailConnect - Frontend and C backend connection
*/

const API_BASE = "/api";

async function readResponse(response) {
    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("The server returned an invalid response.");
    }

    if (!response.ok) {
        throw new Error(
            data.message || "The server could not complete the request."
        );
    }

    return data;
}

async function apiGet(endpoint) {
    const response = await fetch(API_BASE + endpoint);
    return await readResponse(response);
}

async function apiPost(endpoint, data) {
    const formData = new URLSearchParams();

    for (const key in data) {
        formData.append(key, data[key]);
    }

    const response = await fetch(API_BASE + endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData.toString()
    });

    return await readResponse(response);
}

async function getRailwayState() {
    return await apiGet("/state");
}

async function bookTicket(bookingData) {
    return await apiPost("/book", bookingData);
}

async function searchBooking(ticketNumber) {
    return await apiGet(
        "/search?ticket=" + encodeURIComponent(ticketNumber)
    );
}

async function cancelBooking(ticketNumber) {
    return await apiPost("/cancel", {
        ticket: ticketNumber
    });
}

/* Booking page behaviour */
document.addEventListener("DOMContentLoaded", function () {
    const bookingForm = document.getElementById("bookingForm");

    /* Other pages can use the shared API functions above. */
    if (!bookingForm) {
        return;
    }

    const serverMessage = document.getElementById("serverMessage");
    const sourceSelect = document.getElementById("source");
    const destinationSelect = document.getElementById("destination");
    const trainSelect = document.getElementById("trainSelect");

    const findTrainsButton =
        document.getElementById("findTrainsButton");

    const bookTicketButton =
        document.getElementById("bookTicketButton");

    const trainSearchMessage =
        document.getElementById("trainSearchMessage");

    const trainSummary = document.getElementById("trainSummary");

    const selectedTrainName =
        document.getElementById("selectedTrainName");

    const selectedTrainRoute =
        document.getElementById("selectedTrainRoute");

    const selectedTrainSeats =
        document.getElementById("selectedTrainSeats");

    const bookingResult =
        document.getElementById("bookingResult");

    const resultHeading =
        document.getElementById("resultHeading");

    const resultMessage =
        document.getElementById("resultMessage");

    const resultTicket =
        document.getElementById("resultTicket");

    const resultSeat =
        document.getElementById("resultSeat");

    const resultStatus =
        document.getElementById("resultStatus");

    const newBookingButton =
        document.getElementById("newBookingButton");

    let trains = [];
    let serverReady = false;

    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = "message";

        if (type) {
            element.classList.add(type);
        }

        element.hidden = false;
    }

    function resetTrainSelection() {
        trainSelect.innerHTML =
            '<option value="">Find trains for your route first</option>';

        trainSelect.disabled = true;
        bookTicketButton.disabled = true;
        trainSummary.hidden = true;
    }

    function resetSearchResults() {
        trainSearchMessage.hidden = true;
        resetTrainSelection();
    }

    function getSelectedTrain() {
        const trainId = Number(trainSelect.value);

        return trains.find(function (train) {
            return train.id === trainId;
        });
    }

    function updateTrainSummary() {
        const train = getSelectedTrain();

        if (!train) {
            trainSummary.hidden = true;
            bookTicketButton.disabled = true;
            return;
        }

        selectedTrainName.textContent =
            train.name + " (Train " + train.id + ")";

        selectedTrainRoute.textContent =
            train.source + " → " + train.destination;

        selectedTrainSeats.textContent =
            "Available seats: " + train.available +
            " / " + train.capacity;

        selectedTrainSeats.className =
            train.available > 0
                ? "availability"
                : "availability full";

        trainSummary.hidden = false;
        bookTicketButton.disabled = false;
    }

    async function loadTrains() {
        serverReady = false;

        try {
            const data = await getRailwayState();

            if (!Array.isArray(data.trains)) {
                throw new Error("Train information is missing.");
            }

            trains = data.trains;
            serverReady = true;

            showMessage(
                serverMessage,
                "Connected to the reservation server. You can book a ticket.",
                "success"
            );
        } catch (error) {
            showMessage(
                serverMessage,
                "Cannot connect to the C backend. Start the server and reload this page. " +
                    error.message,
                "error"
            );
        }
    }

    findTrainsButton.addEventListener("click", function () {
        resetSearchResults();

        if (!serverReady) {
            showMessage(
                trainSearchMessage,
                "The reservation server is not connected. Start the C server first.",
                "error"
            );
            return;
        }

        const source = sourceSelect.value;
        const destination = destinationSelect.value;

        if (!source || !destination) {
            showMessage(
                trainSearchMessage,
                "Please select both departure and destination stations.",
                "error"
            );
            return;
        }

        if (source === destination) {
            showMessage(
                trainSearchMessage,
                "Departure and destination must be different.",
                "error"
            );
            return;
        }

        const matchingTrains = trains.filter(function (train) {
            return train.source === source &&
                   train.destination === destination;
        });

        if (matchingTrains.length === 0) {
            showMessage(
                trainSearchMessage,
                "No predefined train serves this route. Try Kochi to Kottayam or Kochi to Thrissur.",
                "error"
            );
            return;
        }

        trainSelect.innerHTML =
            '<option value="">Choose a train</option>';

        matchingTrains.forEach(function (train) {
            const option = document.createElement("option");

            option.value = train.id;
            option.textContent =
                train.name + " (" + train.id + ") — " +
                train.available + " seats available";

            trainSelect.appendChild(option);
        });

        trainSelect.disabled = false;

        showMessage(
            trainSearchMessage,
            matchingTrains.length + " matching train(s) found.",
            "success"
        );
    });

    sourceSelect.addEventListener("change", resetSearchResults);
    destinationSelect.addEventListener("change", resetSearchResults);

    trainSelect.addEventListener("change", updateTrainSummary);

    bookingForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!serverReady) {
            showMessage(
                serverMessage,
                "The C backend is not connected. Start the server and try again.",
                "error"
            );
            return;
        }

        const train = getSelectedTrain();

        if (!train) {
            showMessage(
                trainSearchMessage,
                "Find trains and select one before confirming your booking.",
                "error"
            );
            return;
        }

        const name =
            document.getElementById("passengerName").value.trim();

        const passengerId =
            document.getElementById("passengerId").value.trim();

        const age =
            Number(document.getElementById("passengerAge").value);

        if (!name || !passengerId || age < 1 || age > 120) {
            showMessage(
                serverMessage,
                "Please enter a valid name, Passenger ID, and age.",
                "error"
            );
            return;
        }

        bookTicketButton.disabled = true;
        bookTicketButton.textContent = "Processing booking...";

        try {
            const result = await bookTicket({
                name: name,
                passengerId: passengerId,
                age: age,
                trainId: train.id
            });

            resultHeading.textContent =
                result.status === "Confirmed"
                    ? "Your ticket is confirmed!"
                    : "You have been added to the waiting list.";

            resultMessage.textContent = result.message;

            /* Ticket number comes from the C backend. */
            resultTicket.textContent = result.ticket;

            resultSeat.textContent =
                result.seat > 0
                    ? "Assigned seat: " + result.seat
                    : "No seat assigned yet.";

            resultStatus.textContent =
                "Booking status: " + result.status;

            bookingResult.className = "result-panel";
            bookingResult.hidden = false;

            showMessage(
                serverMessage,
                "Booking processed successfully.",
                "success"
            );

            bookingResult.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            /* Refresh the availability after booking. */
            const data = await getRailwayState();
            trains = data.trains;
            updateTrainSummary();

        } catch (error) {
            showMessage(
                serverMessage,
                "Booking failed: " + error.message,
                "error"
            );
        } finally {
            bookTicketButton.textContent = "Confirm booking";
            bookTicketButton.disabled = !getSelectedTrain();
        }
    });

    newBookingButton.addEventListener("click", function () {
        bookingForm.reset();
        bookingResult.hidden = true;
        resetSearchResults();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    loadTrains();
});
