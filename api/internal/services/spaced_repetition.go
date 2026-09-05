package services

import (
	"fmt"
	"math"
	"time"

	"github.com/google/uuid"
)

// SM-2 spaced repetition algorithm
// Ratings: 0-5 (we use 1-5 internally, maps to Anki's 0-5 where 0-2=remembered poorly)
func CalculateNextReview(rating int, prevInterval int, prevEase float64) (intervalDays int, easeFactor float64, nextReview time.Time) {
	easeDelta := rating - 3 // 1->-2, 2->-1, 3->0, 4->1, 5->2

	easeFactor = prevEase + (0.1 - (5.0-float64(rating))*(0.08+(5.0-float64(rating))*0.02))
	if easeFactor < 1.3 {
		easeFactor = 1.3
	}

	if rating <= 1 {
		intervalDays = 1
	} else if rating == 2 {
		intervalDays = 1
	} else if rating == 3 {
		intervalDays = int(math.Max(float64(prevInterval)*easeFactor, 1.0))
	} else if rating == 4 {
		intervalDays = int(math.Max(float64(prevInterval)*easeFactor*1.2, 1.0))
	} else {
		intervalDays = int(math.Max(float64(prevInterval)*easeFactor*1.5, 1.0))
	}

	if intervalDays > 3650 {
		intervalDays = 3650
	}

	nextReview = time.Now().AddDate(0, 0, intervalDays)
	return
}

func ComputeSpacedRepetition(rating int, prevInterval int, prevEase float64) (intervalDays int, easeFactor float64) {
	nextInterval, nextEase, _ := CalculateNextReview(rating, prevInterval, prevEase)
	return nextInterval, nextEase
}

func GetReviewPriority(nextReviewAt time.Time) int {
	if nextReviewAt.Before(time.Now()) || nextReviewAt.Equal(time.Now()) {
		return 0
	}
	daysUntilDue := int(nextReviewAt.Sub(time.Now()).Hours() / 24)
	if daysUntilDue <= 1 {
		return 1
	}
	if daysUntilDue <= 7 {
		return 2
	}
	if daysUntilDue <= 30 {
		return 3
	}
	return 4
}

func NewCardInterval(rating int) int {
	switch {
	case rating <= 2:
		return 1
	case rating == 3:
		return 1
	case rating == 4:
		return 3
	case rating == 5:
		return 7
	default:
		return 1
	}
}

func NewDeckID() uuid.UUID {
	return uuid.New()
}

func NewReviewID() uuid.UUID {
	return uuid.New()
}

func IsValidRating(rating int) bool {
	return rating >= 1 && rating <= 5
}

func DescribeInterval(days int) string {
	switch {
	case days == 0:
		return "Agora"
	case days == 1:
		return "1 dia"
	case days < 30:
		return fmt.Sprintf("%d dias", days)
	case days < 365:
		months := days / 30
		return fmt.Sprintf("%d meses", months)
	default:
		years := days / 365
		return fmt.Sprintf("%d anos", years)
	}
}
