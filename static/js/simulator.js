/**
 * PneumaticLab Simulation Engine
 * Core physics and control logic for the pneumatic actuator simulator.
 * Written with high-performance numerical integration.
 */

class PneumaticLabSimulator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.chart = null;
        
        // Physical Parameters
        this.state = {
            mass: 20,
            damping: 60,
            spring: 100,
            pressure: 20684,
            area: 0.000314, // m^2
            setpoint: 0.065 // 65mm target
        };

        // Controller Parameters
        this.control = {
            enabled: false,
            kp: 1000000,
            ki: 500000,
            kd: 50000,
            integral: 0,
            lastError: 0
        };

        this.initChart();
        this.setupListeners();
        this.simulate();
    }

    initChart() {
        const config = {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Piston Position (mm)',
                        data: [],
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.05)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0
                    },
                    {
                        label: 'Target Setpoint',
                        data: [],
                        borderColor: '#ef4444',
                        borderDash: [5, 5],
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 400 },
                plugins: {
                    legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 } } },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Time (s)', font: { weight: 'bold' } },
                        grid: { display: false }
                    },
                    y: {
                        title: { display: true, text: 'Displacement (mm)', font: { weight: 'bold' } },
                        grid: { color: '#f1f5f9' },
                        suggestedMax: 100,
                        suggestedMin: 0
                    }
                }
            }
        };
        this.chart = new Chart(this.ctx, config);
    }

    setupListeners() {
        // Physical Sliders
        const params = ['m', 'd', 'c', 'p'];
        params.forEach(p => {
            const el = document.getElementById(`slider-${p}`);
            if (el) {
                el.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    document.getElementById(`val-${p}`).textContent = val;
                    
                    const map = { m: 'mass', d: 'damping', c: 'spring', p: 'pressure' };
                    this.state[map[p]] = val;
                    this.simulate();
                });
            }
        });

        // PID Toggle
        const pidToggle = document.getElementById('pid-enable');
        const pidControls = document.getElementById('pid-controls-area');
        if (pidToggle) {
            pidToggle.addEventListener('change', (e) => {
                this.control.enabled = e.target.checked;
                pidControls.classList.toggle('d-none', !this.control.enabled);
                this.simulate();
            });
        }

        // PID Sliders
        const pids = ['kp', 'ki', 'kd'];
        pids.forEach(p => {
            const el = document.getElementById(`slider-${p}`);
            if (el) {
                el.addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value);
                    document.getElementById(`val-${p}`).textContent = val.toLocaleString();
                    this.control[p] = val;
                    this.simulate();
                });
            }
        });
    }

    /**
     * Solves the 2nd order ODE: M*x'' + D*x' + C*x = F
     * Using PID Control: F = PID_Output(error)
     */
    simulate() {
        const dt = 0.01;
        const totalTime = 4.0;
        let t = 0;
        let x = 0; // position (m)
        let v = 0; // velocity (m/s)
        
        // Reset Controller State
        this.control.integral = 0;
        this.control.lastError = this.state.setpoint;

        const labels = [];
        const posData = [];
        const targetData = [];

        while (t <= totalTime) {
            labels.push(t.toFixed(2));
            posData.push((x * 1000).toFixed(2)); // mm
            targetData.push((this.state.setpoint * 1000).toFixed(2)); // mm

            let force;
            if (this.control.enabled) {
                // PID CONTROL MODE
                const error = this.state.setpoint - x;
                this.control.integral += error * dt;
                const derivative = (error - this.control.lastError) / dt;
                
                // PID Output (Force)
                force = (this.control.kp * error) + 
                        (this.control.ki * this.control.integral) + 
                        (this.control.kd * derivative);
                
                this.control.lastError = error;
            } else {
                // OPEN LOOP MODE
                force = this.state.pressure * this.state.area;
            }

            // Physics Update (Euler Integration)
            // accel = (Force - Damping*v - Spring*x) / Mass
            const accel = (force - this.state.damping * v - this.state.spring * x) / this.state.mass;
            v += accel * dt;
            x += v * dt;
            t += dt;

            // Stability check
            if (Math.abs(x) > 10) break; 
        }

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = posData;
        this.chart.data.datasets[1].data = targetData;
        this.chart.update('none');
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    window.labSimulator = new PneumaticLabSimulator('analysisChart');
});
