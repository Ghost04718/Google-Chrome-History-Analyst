# Google Chrome History Analyst

Google Chrome History Analyst is a Chrome extension that allows you to review your browsing history with AI-generated insights. It provides detailed statistics and visualizations of your browsing patterns over different periods (week, month, year).

## Features

- **AI Insights**: Get AI-generated insights about your browsing habits.
- **Time Filters**: View your browsing history for the last week, month, or year.
- **Charts**: Visualize your activity patterns and top categories with interactive charts.
- **Productivity Score**: Calculate your productivity score based on your browsing history.
- **Learning Hours**: Track the time spent on learning websites.
- **Share**: Easily share your browsing insights with others.

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/chrome-history-analyst.git
    cd chrome-history-analyst
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Build the project:
    ```sh
    npm run build
    ```

4. Load the extension in Chrome:
    - Open Chrome and go to `chrome://extensions/`.
    - Enable "Developer mode" in the top right corner.
    - Click "Load unpacked" and select the `dist` folder.

## Usage

1. Click on the extension icon in the Chrome toolbar.
2. Select the time period you want to analyze (week, month, year).
3. View the generated statistics, charts, and AI insights.
4. Use the share button to share your insights with others.

## Development

To start development, run the following command to watch for changes and rebuild automatically:
```sh
npm run watch
```

## Environment Variables

Create a `.env` file in the root directory with the following content:
```
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE=https://models.inference.ai.azure.com
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Chart.js](https://www.chartjs.org/)
- [OpenAI](https://www.openai.com/)
- [Webpack](https://webpack.js.org/)
