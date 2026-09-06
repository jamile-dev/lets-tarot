package models

import (
	"time"
)

// ComputeSpacedRepetition implements SM-2 algorithm
// rating: 1-5 (Anki-style: 1=blackout, 2=wrong, 3=correct with difficulty, 4=correct with hesitation, 5=perfect)
// prevInterval: days since last review
// prevEase: current ease factor (default 2.5)
func ComputeSpacedRepetition(rating int, prevInterval int, prevEase float64) (intervalDays int, easeFactor float64) {
	easeFactor = prevEase + (0.1 - (5.0-float64(rating))*(0.08+(5.0-float64(rating))*0.02))
	if easeFactor < 1.3 {
		easeFactor = 1.3
	}

	if rating <= 1 {
		intervalDays = 1
	} else if rating == 2 {
		intervalDays = 1
	} else if rating == 3 {
		intervalDays = int(float64(prevInterval) * easeFactor)
		if intervalDays < 1 {
			intervalDays = 1
		}
	} else if rating == 4 {
		intervalDays = int(float64(prevInterval) * easeFactor * 1.2)
		if intervalDays < 1 {
			intervalDays = 1
		}
	} else {
		intervalDays = int(float64(prevInterval) * easeFactor * 1.5)
		if intervalDays < 1 {
			intervalDays = 1
		}
	}

	if intervalDays > 3650 {
		intervalDays = 3650
	}

	return
}

// CalculateNextReview returns full SM-2 result with next review date
func CalculateNextReview(rating int, prevInterval int, prevEase float64) (intervalDays int, easeFactor float64, nextReview time.Time) {
	intervalDays, easeFactor = ComputeSpacedRepetition(rating, prevInterval, prevEase)
	nextReview = time.Now().AddDate(0, 0, intervalDays)
	return
}
