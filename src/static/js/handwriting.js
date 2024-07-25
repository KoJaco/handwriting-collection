const canvas = document.getElementById("signature-canvas");
const ctx = canvas.getContext("2d");
let drawing = false;
let strokes = [];
let currentStroke = null;
let lastPoint = null;

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
        timestamp: new Date().toISOString(),
        points: [],
        pressures: [],
        angles: [],
        velocities: [],
        accelerations: [],
    };
    addPoint(event, true); // Initial point with moveTo
}

function stopDrawing() {
    drawing = false;
    if (currentStroke) {
        strokes.push(currentStroke);
        currentStroke = null;
        lastPoint = null;
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
        pressure = 0.5,
        tiltX = 0,
        tiltY = 0;

    if (event.touches) {
        x = event.touches[0].clientX - rect.left;
        y = event.touches[0].clientY - rect.top;
        if (event.touches[0].force) {
            pressure = event.touches[0].force;
        }
        tiltX = event.touches[0].tiltX || 0;
        tiltY = event.touches[0].tiltY || 0;
    } else {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
        pressure = event.pressure || 0.5;
        tiltX = event.tiltX || 0;
        tiltY = event.tiltY || 0;
    }

    const timestamp = new Date().toISOString();
    const point = { x, y, timestamp };

    if (lastPoint) {
        const velocity = calculateVelocity(lastPoint, point);
        currentStroke.velocities.push(velocity);

        if (currentStroke.velocities.length > 1) {
            const acceleration = calculateAcceleration(
                currentStroke.velocities
            );
            currentStroke.accelerations.push(acceleration);
        }
    } else {
        currentStroke.velocities.push(0); // Initial velocity
        currentStroke.accelerations.push(0); // Initial acceleration
    }

    currentStroke.points.push(point);
    currentStroke.pressures.push(pressure);
    currentStroke.angles.push({ tiltX, tiltY });

    if (initial) {
        ctx.moveTo(x, y); // Move to the initial point of the stroke
    } else {
        ctx.lineTo(x, y); // Draw line to subsequent points
    }

    ctx.stroke();
    lastPoint = point;
}

// TODO: Are these velocity/accel calcs correct?
function calculateVelocity(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dt = new Date(p2.timestamp) - new Date(p1.timestamp);
    return Math.sqrt(dx * dx + dy * dy) / dt;
}

function calculateAcceleration(velocities) {
    const dv =
        velocities[velocities.length - 1] - velocities[velocities.length - 2];
    const dt = 1; // Constant time interval?
    return dv / dt;
}

document.getElementById("save-button").addEventListener("click", saveCanvas);
document.getElementById("reset-button").addEventListener("click", resetCanvas);

function resetCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes = [];
    drawing = false;
    currentStroke = null;
    lastPoint = null;
}

function saveCanvas() {
    if (strokes.length > 0) {
        const phrase = "chicken burger";
        const data = {
            phrase: phrase,
            strokes: strokes.map((stroke) => ({
                points: stroke.points,
                timestamp: stroke.timestamp,
                pressures: stroke.pressures,
                angles: stroke.angles,
                velocities: stroke.velocities,
                accelerations: stroke.accelerations,
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
    } else {
        alert("Yeah, you need to actually write something");
    }
}
