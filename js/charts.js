// Charts module
class ChartsManager {
    constructor() {
        this.chart1Data = [];
        this.chart2Data = [];
    }

    async loadChart1Data() {
        const jwt = localStorage.getItem('jwt');
        const query = `
            {
                user {
                    events(where: {event: {id: {_eq: 303}}}) {
                        event {
                            xps {
                                amount
                                path
                            }
                        }
                    }
                }
            }
        `;

        try {
            const response = await fetch(API_PATH, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({ query }),
            });

            const result = await response.json();
            const data = result.data;
            
            if (Array.isArray(data?.user) && data.user.length > 0) {
                const userData = data.user[0];
                if (Array.isArray(userData.events) && userData.events.length > 0) {
                    this.chart1Data = userData.events[0].event.xps
                        .slice(1)
                        .map((item) => ({
                            amount: item.amount,
                            path: item.path.replace(/^.*div-01\//, "")
                        }));
                }
            }
        } catch (error) {
            console.error('Error Chart1:', error);
        }
    }

    async loadChart2Data() {
        const jwt = localStorage.getItem('jwt');
        const query = `
            {
                user {
                    transactions {
                        amount
                        createdAt
                        transaction_type {
                            type
                        }
                    }
                }
            }
        `;

        try {
            const response = await fetch(API_PATH, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${jwt}`,
                },
                body: JSON.stringify({ query }),
            });

            const result = await response.json();
            const data = result.data;
            
            if (Array.isArray(data?.user) && data.user.length > 0) {
                const userData = data.user[0];
                if (Array.isArray(userData.transactions) && userData.transactions.length > 0) {
                    this.chart2Data = userData.transactions
                        .filter(item => item.transaction_type.type === "xp")
                        .map(item => ({
                            amount: item.amount,
                            createdAt: new Date(item.createdAt)
                        }));
                }
            }
        } catch (error) {
            console.error('Error Chart2:', error);
        }
    }

    renderChart1(containerId) {
        const container = document.getElementById(containerId);
        const data = this.chart1Data;
        
        if (!data.length) {
            container.innerHTML = '<p>No data available</p>';
            return;
        }

        const width = 1000;
        const barHeight = 20;
        const barSpacing = 10;
        
        const maxAmount = Math.max(...data.map(item => item.amount));
        const maxLabelLength = Math.max(...data.map(item => item.path.length));
        const labelWidth = maxLabelLength * 8 + 5;
        const maxValueWidth = String(maxAmount).length * 15;
        const scaleFactor = (width - labelWidth - maxValueWidth) / (maxAmount || 1);
        const height = data.length * (barHeight + barSpacing);

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'chart1');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height + 30);

        data.forEach((item, index) => {
            const barWidth = item.amount * scaleFactor;
            const y = index * (barHeight + barSpacing);

            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('transform', `translate(0, ${y + 16})`);

            // Label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'bar-label');
            text.setAttribute('x', 0);
            text.setAttribute('y', 0);
            text.setAttribute('alignment-baseline', 'middle');
            text.setAttribute('text-anchor', 'start');
            text.textContent = item.path;
            g.appendChild(text);

            // Line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', 'line');
            line.setAttribute('x1', labelWidth);
            line.setAttribute('y1', -barHeight + 6);
            line.setAttribute('x2', labelWidth);
            line.setAttribute('y2', height);
            g.appendChild(line);

            // Bar
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('class', 'bar-rect');
            rect.setAttribute('x', labelWidth + 6);
            rect.setAttribute('y', -barHeight + 6);
            rect.setAttribute('width', barWidth);
            rect.setAttribute('height', barHeight);
            rect.setAttribute('rx', 6);
            g.appendChild(rect);

            // Value
            const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            valueText.setAttribute('class', 'bar-value');
            valueText.setAttribute('x', labelWidth + 6 + barWidth + 8);
            valueText.setAttribute('y', 0);
            valueText.setAttribute('alignment-baseline', 'middle');
            valueText.setAttribute('text-anchor', 'start');
            valueText.textContent = item.amount;
            g.appendChild(valueText);

            svg.appendChild(g);
        });

        container.innerHTML = `
            <div class="chart1-container">
                <h2>XP gained by projects</h2>
            </div>
        `;
        container.querySelector('.chart1-container').appendChild(svg);
    }

    renderChart2(containerId) {
        const container = document.getElementById(containerId);
        const data = this.chart2Data;
        
        if (!data.length) {
            container.innerHTML = '<p>No data available</p>';
            return;
        }

        const sortedData = data.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

        const width = 800;
        const height = 400;
        const topPadding = 30;
        const maxAmount = Math.max(...sortedData.map(d => d.amount));

        const xScale = (date) => {
            const minDate = new Date(Math.min(...sortedData.map(d => d.createdAt.getTime())));
            const maxDate = new Date(Math.max(...sortedData.map(d => d.createdAt.getTime())));
            return ((date.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())) * width;
        };

        const yScale = (amount) => {
            return topPadding + (height - topPadding) - (amount / maxAmount) * (height - topPadding);
        };

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'chart2');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        // Grid lines and labels
        for (let i = 0; i < 5; i++) {
            const value = (maxAmount / 4) * i;
            const yPosition = yScale(value);

            // Grid line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('class', 'y-step');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', yPosition);
            line.setAttribute('x2', width);
            line.setAttribute('y2', yPosition);
            svg.appendChild(line);

            // Label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'y-value');
            text.setAttribute('x', 10);
            text.setAttribute('y', yPosition - 6);
            text.textContent = value.toFixed(0);
            svg.appendChild(text);
        }

        // Data path
        const pathData = sortedData.map((dataPoint, index) => {
            const x = xScale(dataPoint.createdAt);
            const y = yScale(dataPoint.amount);
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        svg.appendChild(path);

        // Axes
        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', 0);
        yAxis.setAttribute('y1', 0);
        yAxis.setAttribute('x2', 0);
        yAxis.setAttribute('y2', height);
        yAxis.setAttribute('stroke', 'white');
        yAxis.setAttribute('stroke-width', 2);
        svg.appendChild(yAxis);

        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('x1', 0);
        xAxis.setAttribute('y1', height);
        xAxis.setAttribute('x2', width);
        xAxis.setAttribute('y2', height);
        xAxis.setAttribute('stroke', 'white');
        xAxis.setAttribute('stroke-width', 2);
        svg.appendChild(xAxis);

        container.innerHTML = `
            <div class="chart2-container">
                <h2>Project XP gained in time</h2>
            </div>
        `;
        container.querySelector('.chart2-container').appendChild(svg);
    }

    async loadAndRenderCharts() {
        await this.loadChart1Data();
        await this.loadChart2Data();
        this.renderChart1('chart1');
        this.renderChart2('chart2');
    }
}

// Global charts instance
const chartsManager = new ChartsManager();