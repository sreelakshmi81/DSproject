/* =========================================================
   RAILCONNECT — FRONT-END RESERVATION SYSTEM
   ========================================================= */

const STORAGE_KEY = "railConnectData";
const TRAIN_CAPACITY = 9;

/* ---------- 1. Initial data ---------- */

function createInitialData() {
    const data = {
        trains: [
            {
                id: "101",
                name: "Coastal Express",
                source: "Kochi",
                destination: "Kottayam",
                capacity: TRAIN_CAPACITY,
                ticketPrefix: "TA",
                nextTicketNumber: 1001
            },
            {
                id: "202",
                name: "City Link",
                source: "Kochi",
                destination: "Thrissur",
                capacity: TRAIN_CAPACITY,
                ticketPrefix: "TB",
                nextTicketNumber: 1001
            }
        ],
        reservations: [],
        nextWaitingNumber: 1001,
        nextCreatedAt: 1
    };

    const coastalPassengers = [
        ["Anu", "P101", 21],
        ["Meera", "P102", 24],
        ["Rahul", "P103", 22],
        ["Arun", "P104", 25],
        ["Diya", "P105", 20],
        ["Nikhil", "P106", 23]
    ];

    coastalPassengers.forEach((passenger, index) => {
        const ticketNumber = 1001 + index;

        data.reservations.push({
            reference: "TA-" + ticketNumber,
            ticketNumber,
            name: passenger[0],
            passengerId: passenger[1],
            age: passenger[2],
            trainId: "101",
            seat: index + 1,
            status: "Confirmed",
            createdAt: data.nextCreatedAt++
        });

        data.trains[0].nextTicketNumber++;
    });

    const cityPassengers = [
        ["Rahul", "P201", 22],
        ["Akhil", "P202", 23],
        ["Maya", "P203", 21],
        ["Arjun", "P204", 24],
        ["Sneha", "P205", 20],
        ["Vishnu", "P206", 25],
        ["Anjali", "P207", 22],
        ["Kiran", "P208", 23],
        ["Neha", "P209", 21]
    ];

    cityPassengers.forEach((passenger, index) => {
        const ticketNumber = 1001 + index;

        data.reservations.push({
            reference: "TB-" + ticketNumber,
            ticketNumber,
            name: passenger[0],
            passengerId: passenger[1],
            age: passenger[2],
            trainId: "202",
            seat: index + 1,
            status: "Confirmed",
            createdAt: data.nextCreatedAt++
        });

        data.trains[1].nextTicketNumber++;
    });

    const waitingPassengers = [
        ["Sara", "P210", 22],
        ["John", "P211", 24],
        ["Ammu", "P212", 20]
    ];

    waitingPassengers.forEach((passenger) => {
        data.reservations.push({
            reference: "WL-" + data.nextWaitingNumber++,
            ticketNumber: null,
            name: passenger[0],
            passengerId: passenger[1],
            age: passenger[2],
            trainId: "202",
            seat: null,
            status: "Waiting List",
            createdAt: data.nextCreatedAt++
        });
    });

    return data;
}

/* ---------- 2. Save and load data ---------- */

function saveRailwayData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getRailwayData() {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData) {
        try {
            const data = JSON.parse(savedData);

            if (
                Array.isArray(data.trains) &&
                Array.isArray(data.reservations)
            ) {
                data.trains.forEach((train) => {
                    if (!train.ticketPrefix) {
                        train.ticketPrefix =
                            train.id === "101" ? "TA" : "TB";
                    }

                    if (!Number.isInteger(train.nextTicketNumber)) {
                        const numbers = data.reservations
                            .filter(
                                (reservation) =>
                                    reservation.trainId === train.id &&
                                    Number.isInteger(
                                        reservation.ticketNumber
                                    )
                            )
                            .map(
                                (reservation) =>
                                    reservation.ticketNumber
                            );

                        train.nextTicketNumber = Math.max(
                            1001,
                            ...numbers.map((number) => number + 1)
                        );
                    }
                });

                if (!Number.isInteger(data.nextWaitingNumber)) {
                    const waitingNumbers = data.reservations
                        .map((reservation) => {
                            const match = String(
                                reservation.reference || ""
                            ).match(/^WL-(\d+)$/i);

                            return match ? Number(match[1]) : 1000;
                        });

                    data.nextWaitingNumber = Math.max(
                        1001,
                        ...waitingNumbers.map((number) => number + 1)
                    );
                }

                if (!Number.isInteger(data.nextCreatedAt)) {
                    data.nextCreatedAt =
                        data.reservations.reduce(
                            (maximum, reservation) =>
                                Math.max(
                                    maximum,
                                    reservation.createdAt || 0
                                ),
                            0
                        ) + 1;
                }

                return data;
            }
        } catch (error) {
            console.error(
                "Could not read saved railway data:",
                error
            );
        }
    }

    const data = createInitialData();
    saveRailwayData(data);

    return data;
}

/* ---------- 3. Train information ---------- */

function getAllTrains() {
    return getRailwayData().trains;
}

function getTrainById(trainId) {
    return (
        getRailwayData().trains.find(
            (train) => train.id === String(trainId)
        ) || null
    );
}

function getTrainName(trainId) {
    const train = getTrainById(trainId);
    return train ? train.name : "Unknown train";
}

function getTrainReservations(trainId) {
    return getRailwayData().reservations
        .filter(
            (reservation) =>
                reservation.trainId === String(trainId)
        )
        .sort((a, b) => a.createdAt - b.createdAt);
}

function getConfirmedReservations(trainId) {
    return getTrainReservations(trainId).filter(
        (reservation) => reservation.status === "Confirmed"
    );
}

function getWaitingReservations(trainId) {
    return getTrainReservations(trainId).filter(
        (reservation) => reservation.status === "Waiting List"
    );
}

function getAvailableSeats(trainId) {
    const train = getTrainById(trainId);

    if (!train) {
        return [];
    }

    const occupiedSeats = getConfirmedReservations(trainId).map(
        (reservation) => reservation.seat
    );

    const availableSeats = [];

    for (let seat = 1; seat <= train.capacity; seat++) {
        if (!occupiedSeats.includes(seat)) {
            availableSeats.push(seat);
        }
    }

    return availableSeats;
}

function getTrainSummary(trainId) {
    const train = getTrainById(trainId);

    if (!train) {
        return null;
    }

    const confirmed = getConfirmedReservations(trainId);
    const waiting = getWaitingReservations(trainId);
    const available = getAvailableSeats(trainId);

    return {
        train,
        totalPassengers: confirmed.length + waiting.length,
        confirmedPassengers: confirmed.length,
        availableSeats: available.length,
        availableSeatNumbers: available,
        waitingPassengers: waiting.length
    };
}

function getRailwayState() {
    const data = getRailwayData();

    return {
        trains: data.trains,
        reservations: data.reservations,
        totalPassengers: data.reservations.filter(
            (reservation) =>
                reservation.status === "Confirmed" ||
                reservation.status === "Waiting List"
        ).length,
        confirmedTickets: data.reservations.filter(
            (reservation) =>
                reservation.status === "Confirmed"
        ).length,
        waitingPassengers: data.reservations.filter(
            (reservation) =>
                reservation.status === "Waiting List"
        ).length
    };
}

/* ---------- 4. Ticket number generation ---------- */

function generateTicketNumber(data, train) {
    const ticketNumber = train.nextTicketNumber;
    train.nextTicketNumber++;

    return {
        ticketNumber,
        reference: train.ticketPrefix + "-" + ticketNumber
    };
}

function generateWaitingReference(data) {
    const reference = "WL-" + data.nextWaitingNumber;
    data.nextWaitingNumber++;

    return reference;
}

/* ---------- 5. Book a ticket ---------- */

function bookTicket(bookingData) {
    if (!bookingData) {
        return {
            success: false,
            message: "Booking details are missing."
        };
    }

    const name = String(bookingData.name || "").trim();
    const passengerId = String(
        bookingData.passengerId || ""
    ).trim();
    const age = Number(bookingData.age);
    const trainId = String(bookingData.trainId || "");

    if (!name || !passengerId) {
        return {
            success: false,
            message: "Enter the passenger name and Passenger ID."
        };
    }

    if (!Number.isInteger(age) || age < 1 || age > 120) {
        return {
            success: false,
            message: "Age must be between 1 and 120."
        };
    }

    const data = getRailwayData();

    const train = data.trains.find(
        (item) => item.id === trainId
    );

    if (!train) {
        return {
            success: false,
            message: "Please select a valid train."
        };
    }

    /* Check for duplicate Passenger ID on this train.
       Cancelled reservations do not block a new booking. */

    const duplicate = data.reservations.find(
        (reservation) =>
            reservation.trainId === trainId &&
            reservation.passengerId.trim().toLowerCase() ===
                passengerId.toLowerCase() &&
            (
                reservation.status === "Confirmed" ||
                reservation.status === "Waiting List"
            )
    );

    if (duplicate) {
        return {
            success: false,
            duplicate: true,
            message:
                "Passenger ID " + passengerId +
                " already has an active reservation on this train. " +
                "Please try again with a different Passenger ID."
        };
    }

    const availableSeats = getAvailableSeats(trainId);

    /* If a seat is available, confirm the booking. */

    if (availableSeats.length > 0) {
        const ticket = generateTicketNumber(data, train);

        const reservation = {
            reference: ticket.reference,
            ticketNumber: ticket.ticketNumber,
            name,
            passengerId,
            age,
            trainId,
            seat: availableSeats[0],
            status: "Confirmed",
            createdAt: data.nextCreatedAt++
        };

        data.reservations.push(reservation);
        saveRailwayData(data);

        return {
            success: true,
            status: "Confirmed",
            message: "Ticket booked successfully!",
            reference: reservation.reference,
            ticket: reservation.reference,
            ticketNumber: reservation.ticketNumber,
            seat: reservation.seat,
            reservation
        };
    }

    /* Train is full: ask before changing any data. */

    const joinWaitingList = window.confirm(
        "Sorry, " + train.name + " is fully booked.\n\n" +
        "Would you like to join the waiting list?\n\n" +
        "Choose OK to join the waiting list.\n" +
        "Choose Cancel to stop the booking."
    );

    if (!joinWaitingList) {
        return {
            success: false,
            declinedWaitingList: true,
            message:
                "Booking cancelled. You were not added to the waiting list."
        };
    }

    /* Only create a waiting reservation after confirmation. */

    const reservation = {
        reference: generateWaitingReference(data),
        ticketNumber: null,
        name,
        passengerId,
        age,
        trainId,
        seat: null,
        status: "Waiting List",
        createdAt: data.nextCreatedAt++
    };

    data.reservations.push(reservation);
    saveRailwayData(data);

    return {
        success: true,
        status: "Waiting List",
        message:
            "You have been added to the waiting list. " +
            "Your waiting-list reference is " +
            reservation.reference + ".",
        reference: reservation.reference,
        ticket: null,
        ticketNumber: null,
        seat: null,
        reservation
    };
}

/* ---------- 6. Search reservations ---------- */

function searchBooking(reference) {
    const searchValue = String(reference || "")
        .trim()
        .toLowerCase();

    if (!searchValue) {
        return null;
    }

    const data = getRailwayData();

    return (
        data.reservations.find((reservation) => {
            return (
                String(reservation.reference).toLowerCase() ===
                    searchValue ||
                (
                    reservation.ticketNumber !== null &&
                    String(reservation.ticketNumber) === searchValue
                )
            );
        }) || null
    );
}

function getBookingsByPassengerId(passengerId) {
    const searchValue = String(passengerId || "")
        .trim()
        .toLowerCase();

    if (!searchValue) {
        return [];
    }

    return getRailwayData().reservations
        .filter(
            (reservation) =>
                reservation.passengerId.toLowerCase() ===
                searchValue
        )
        .sort((a, b) => a.createdAt - b.createdAt);
}

function getReservationStatus(reference) {
    const reservation = searchBooking(reference);

    return reservation ? reservation.status : "Not found";
}

/* ---------- 7. Cancel a booking ---------- */

function cancelBooking(reference) {
    const searchValue = String(reference || "")
        .trim()
        .toLowerCase();

    if (!searchValue) {
        return {
            success: false,
            message: "Enter a ticket number or booking reference."
        };
    }

    const data = getRailwayData();

    const reservation = data.reservations.find((item) => {
        return (
            String(item.reference).toLowerCase() === searchValue ||
            (
                item.ticketNumber !== null &&
                String(item.ticketNumber) === searchValue
            )
        );
    });

    if (!reservation) {
        return {
            success: false,
            message: "Reservation not found."
        };
    }

    if (
        reservation.status !== "Confirmed" &&
        reservation.status !== "Waiting List"
    ) {
        return {
            success: false,
            message: "This reservation has already been cancelled."
        };
    }

    const wasConfirmed = reservation.status === "Confirmed";
    const trainId = reservation.trainId;
    const releasedSeat = reservation.seat;

    reservation.status = "Cancelled";
    reservation.seat = null;

    if (wasConfirmed) {
        /* FIFO: promote the earliest waiting passenger. */

        const nextPassenger = data.reservations
            .filter(
                (item) =>
                    item.trainId === trainId &&
                    item.status === "Waiting List"
            )
            .sort((a, b) => a.createdAt - b.createdAt)[0];

        if (nextPassenger) {
            const train = data.trains.find(
                (item) => item.id === trainId
            );

            const ticket = generateTicketNumber(data, train);

            nextPassenger.status = "Confirmed";
            nextPassenger.seat = releasedSeat;
            nextPassenger.ticketNumber = ticket.ticketNumber;
            nextPassenger.reference = ticket.reference;

            saveRailwayData(data);

            return {
                success: true,
                message:
                    "Booking cancelled successfully. " +
                    nextPassenger.name +
                    " was promoted from the waiting list and assigned " +
                    "seat " + releasedSeat +
                    ". New ticket reference: " + ticket.reference + ".",
                cancelled: reservation,
                promoted: nextPassenger
            };
        }
    }

    saveRailwayData(data);

    return {
        success: true,
        message: wasConfirmed
            ? "Booking cancelled. Seat " + releasedSeat +
              " is now available."
            : "Waiting-list reservation cancelled successfully.",
        cancelled: reservation,
        promoted: null
    };
}

/* ---------- 8. Reset demo data ---------- */

function resetRailwayDemoData() {
    const data = createInitialData();

    saveRailwayData(data);

    return {
        success: true,
        message: "Demo reservations have been reset."
    };
}