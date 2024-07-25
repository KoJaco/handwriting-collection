const canvas = document.getElementById("signature-canvas");
const ctx = canvas.getContext("2d");
let drawing = false;
let strokes = [];
let currentStroke = null;

/**
 * What else to include
 *
 * Velocity
 * Acceleration
 * Tilt angles
 * Pressure
 * Stroke length
 * Stroke Curvature
 * Time between strokes
 *
 */

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mousemove", draw);

canvas.addEventListener("touchstart", startDrawing);
canvas.addEventListener("touchend", stopDrawing);
canvas.addEventListener("touchmove", draw);

function startDrawing(event) {
    drawing = true;
    ctx.beginPath(); // Start a new path
    currentStroke = {
        timestamp: new Date().toISOString(), // Use ISO string for the current timestamp
        points: [],
        pressures: [],
        angles: [],
    };
    addPoint(event, true); // Initial point with moveTo
}

function stopDrawing() {
    drawing = false;
    if (currentStroke) {
        strokes.push(currentStroke);
        currentStroke = null;
    }
}

function draw(event) {
    if (!drawing) return;
    addPoint(event, false); // Subsequent points with lineTo
}

function addPoint(event, initial) {
    const rect = canvas.getBoundingClientRect();
    let x,
        y,
        pressure = 0.5;

    if (event.touches) {
        x = event.touches[0].clientX - rect.left;
        y = event.touches[0].clientY - rect.top;
        if (event.touches[0].force) {
            pressure = event.touches[0].force;
        }
    } else {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
    }

    currentStroke.points.push({ x, y, timestamp: new Date().toISOString() });
    currentStroke.pressures.push(pressure);
    currentStroke.angles.push(event.tiltX || 0);

    if (initial) {
        ctx.moveTo(x, y); // Move to the initial point of the stroke
    } else {
        ctx.lineTo(x, y); // Draw line to subsequent points
    }

    ctx.stroke();
}

function resetCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes = [];
}

document.getElementById("save-button").addEventListener("click", saveCanvas);
document.getElementById("reset-button").addEventListener("click", resetCanvas);

function saveCanvas() {
    const phrase = "example phrase"; // Replace with actual phrase as needed
    const data = {
        phrase: phrase,
        strokes: strokes.map((stroke) => ({
            points: stroke.points,
            timestamp: stroke.timestamp,
            pressures: stroke.pressures,
            angles: stroke.angles,
        })),
    };

    fetch("/api/save", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    })
        .then((response) => {
            if (response.ok) {
                return response.blob();
            } else {
                throw new Error("Error saving data");
            }
        })
        .then((blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = "handwriting_data.csv";
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch((error) => {
            alert(error.message);
        });
}
