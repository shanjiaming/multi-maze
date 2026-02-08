# StackMaze

**StackMaze** is a creative puzzle game where you build and navigate multi-layered mazes.
Unlike traditional 2D mazes, here you can place "blocks" on top of each other, creating vertical depth and complex navigational challenges.

![StackMaze Screenshot](public/vite.svg) 
*(Note: Replace with actual screenshot)*

## 🎮 How to Play

1. **Goal**: Move the **Red Ball** from the **Red Flag (Start)** to the **Checkered Flag (End)**.
2. **Controls**:
   - **WASD / Arrows**: Move player.
   - **1-9 keys**: Lift or Place blocks corresponding to their layer number.
3. **Rules**:
   - You cannot lift a block if you are standing on it.
   - You cannot lift a block if another block is stacked on top of it.
   - You must build your path dynamically!

## 🌍 Community Sharing

StackMaze features a built-in **Community Hub** powered by Supabase.

- **Browse Maps**: Click the 🌍 icon to see maps created by other players. Click "Play" to load them instantly.
- **Upload**: Proud of your creation? Give it a name and author tag, then upload it for the world to solve!

## 🛠️ Tech Stack

- **Frontend**: React, Vite
- **Styling**: Plain CSS (Glassmorphism design)
- **Backend / Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel

## 🚀 Development

1. Clone the repository:
   ```bash
   git clone https://github.com/shanjiaming/stackmaze.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run locally:
   ```bash
   npm run dev
   ```

## License

MIT
