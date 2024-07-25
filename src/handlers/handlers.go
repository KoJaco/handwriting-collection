package handlers

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"strconv"
)

type Point struct {
	X         float64 `json:"x"`
	Y         float64 `json:"y"`
	Timestamp string  `json:"timestamp"`
}

type Stroke struct {
	Points    []Point   `json:"points"`
	Pressures []float64 `json:"pressures"`
	Angles    []float64 `json:"angles"`
	Timestamp string    `json:"timestamp"` // this is in ISO format... is speed a concern? Date.now() would be better for speed/storage
}

type HandwritingData struct {
	Phrase  string   `json:"phrase"`
	Strokes []Stroke `json:"strokes"`
}

func RenderTemplate(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("src/templates/index.html")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	tmpl.Execute(w, nil)
}

func SaveData(w http.ResponseWriter, r *http.Request) {
	var data HandwritingData
	err := json.NewDecoder(r.Body).Decode(&data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	log.Printf("Received data: %+v", data)

	w.Header().Set("Content-Disposition", "attachment; filename=handwriting_data.csv")
	w.Header().Set("Content-Type", "text/csv")

	writer := csv.NewWriter(w)
	defer writer.Flush()

	writer.Write([]string{"Phrase", data.Phrase})
	writer.Write([]string{"Stroke", "Point Index", "X", "Y", "Timestamp", "Pressure", "Angle"})

	for strokeIndex, stroke := range data.Strokes {
		for pointIndex, point := range stroke.Points {
			record := []string{
				strconv.Itoa(strokeIndex + 1),
				strconv.Itoa(pointIndex + 1),
				fmt.Sprintf("%f", point.X),
				fmt.Sprintf("%f", point.Y),
				point.Timestamp,
				fmt.Sprintf("%f", stroke.Pressures[pointIndex]),
				fmt.Sprintf("%f", stroke.Angles[pointIndex]),
			}
			writer.Write(record)
		}
	}
}
