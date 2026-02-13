# Arena Mode Schema Design

## Overview
Arena Mode introduces competitive, gamified debates. The schema supports:
- **Matches (`arena_matches`)**: Individual debate sessions with HP, status effects, and turn history.
- **Rankings (`arena_stats`)**: Persistent player stats including ELO, wins/losses, and streaks.
- **Analytics (`arena_rounds`)**: Detailed turn-by-turn logs for balancing and analysis.
- **Seasons (`arena_seasons`)**: Time-bound competitive periods.

## Tables

### 1. `arena_matches`
Stores the state of a single game.
- `id` (PK): UUID
- `user_id`: Player ID
- `user_hp`, `ai_hp`: Current health
- `max_hp`: Max health (default 100)
- `combo_count`: Active combo multiplier
- `status_effects`: JSON array of active effects (stunned, burning, etc.)
- `turn_history`: JSON summary of turns (lightweight history)
- `winner`: 'user', 'ai', or NULL (in progress)

### 2. `arena_stats`
Persistent player record.
- `user_id` (PK)
- `elo_rating`: Skill rating (default 1200)
- `wins`, `losses`, `draws`
- `current_streak`, `best_streak`
- `total_damage_dealt`, `total_damage_taken`
- `average_turns_per_match`

### 3. `arena_rounds`
Granular event log for data analysis (optional for gameplay, critical for balancing).
- `id` (PK): Auto-increment
- `match_id`: FK to `arena_matches`
- `round_number`: 1, 2, 3...
- `user_action`, `ai_action`: Action types (attack, defend, heal)
- `user_damage`, `ai_damage`: Damage values
- `timestamp`: When the turn occurred

### 4. `arena_seasons`
- `id` (PK)
- `name`: "Season 1: Genesis"
- `start_date`, `end_date`
- `is_active`: Boolean flag

## Relationships
- `users` 1:1 `arena_stats`
- `users` 1:N `arena_matches`
- `arena_matches` 1:N `arena_rounds`
