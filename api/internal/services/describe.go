package services

import (
	"fmt"
	"time"
)

// DescribeInterval returns human-readable interval description in pt-BR
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
		if months == 1 {
			return "1 mês"
		}
		return fmt.Sprintf("%d meses", months)
	default:
		years := days / 365
		if years == 1 {
			return "1 ano"
		}
		return fmt.Sprintf("%d anos", years)
	}
}

func DescribePriority(priority int) string {
	switch {
	case priority == 0:
		return "Devido agora"
	case priority == 1:
		return "Dentro de 1 dia"
	case priority == 2:
		return "Esta semana"
	case priority == 3:
		return "Este mês"
	default:
		return "Pouco urgente"
	}
}

func DescribeRating(rating int) string {
	switch {
	case rating == 1:
		return "Neuza — esqueci tudo"
	case rating == 2:
		return "Difícil — errei"
	case rating == 3:
		return "Regular — acertei com esforço"
	case rating == 4:
		return "Bom — acertei com hesitação"
	case rating == 5:
		return "Perfeito — lembro tudo"
	default:
		return "Desconhecido"
	}
}

func FormatReviewDate(t time.Time) string {
	return t.Format("02/01/2006")
}

func FormatRelativeTime(t time.Time) string {
	now := time.Now()
	diff := now.Sub(t)

	if diff < 0 {
		return "Agora"
	}

	minutes := int(diff.Minutes())
	hours := int(diff.Hours())
	days := int(diff.Hours() / 24)

	switch {
	case minutes < 1:
		return "Agora"
	case minutes < 60:
		return fmt.Sprintf("%d min atrás", minutes)
	case hours < 24:
		if hours == 1 {
			return "1 hora atrás"
		}
		return fmt.Sprintf("%d horas atrás", hours)
	case days < 7:
		if days == 1 {
			return "Ontem"
		}
		return fmt.Sprintf("%d dias atrás", days)
	default:
		return t.Format("02/01/2006")
	}
}
