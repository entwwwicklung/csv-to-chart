let swal = require('sweetalert')
let path = require('path')

let {Chart} = require('chart.js');
let {ChartDataLabels} = require('chartjs-plugin-datalabels')
let isDev = require('electron-is-dev')
const { exec } = require('child_process')

class Main {
    constructor () {

        this.dropArea = document.getElementsByTagName('html')[0]
        this.mainContainer = document.getElementById('main-container')
        this.welcomeCaption = document.getElementById('welcome-caption')
        this.infoMsg = document.getElementById('info-message')
        this.canvas = document.getElementById("bar-chart");
        this.ctx = this.canvas.getContext('2d');
        this.backBtn = document.getElementById('back-button')
        this.changeColorBtn = document.getElementById('change-color')
        this.myBarChart = null

        this.bgColors = [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)',
        ]

        this.fgColors = [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
        ]

        this.legendLabelPlugin()
    
        ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, this.preventDefaults, false)
        })
          
        ;['dragenter', 'dragover'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, this.highlight, false)
        })
          
        ;['dragleave', 'drop'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, this.unhighlight, false)
        })

        this.dropArea.addEventListener('drop', this.handleDrop, false)

        ;['click'].forEach(eventName => {
              this.backBtn.addEventListener(eventName, this.preventDefaults, false)
              this.backBtn.addEventListener(eventName, this.showWelcomePage, false)
              this.changeColorBtn.addEventListener(eventName, this.preventDefaults, false)
              this.changeColorBtn.addEventListener(eventName, this.changeColor, false)
        })

    }

    preventDefaults = (e) => {
        e.preventDefault()
        e.stopPropagation()        
    }

    highlight = (e) => {
        this.dropArea.classList.add('highlight')
        this.infoMsg.innerHTML = 'Release'
    }    

    unhighlight = (e) => {
        this.dropArea.classList.remove('highlight')
        this.infoMsg.innerHTML = 'Drag and drop .csv file here'
    }

    handleDrop = (e) => {
        let dt = e.dataTransfer
        let filePath = dt.files[0].path

        this.invokePython(filePath)
    }

    changeColor = () => {
        let randomNumber = Math.floor(Math.random() * 6)
        let bgColor = this.bgColors[randomNumber]
        let fgColor = this.fgColors[randomNumber]
    
    this.updateChart(bgColor,fgColor)
    }
    
    invokePython = (filePath) => {

        let extendedScope = this
        let executable = ''
        if (isDev) {
            executable = path.join(__dirname, 'engine/calculate_csv.py')
        } else {
            executable = path.join(process.resourcesPath, 'engine/dist/calculate_csv/calculate_csv.exe')
        }

        exec(executable + ' ' + filePath, (err, stdout, stderr) => {
            
            if (err) {
                swal("Oops!", stderr, "error")
            } else {
                let result = JSON.parse(stdout)
                extendedScope.showChart(result['report'], result['filename'], result['y_axis_suffix'])
                extendedScope.hideWelcomePage()
            }
        })
    }

    showChart = (results, file, suffix) => {

        let _labels = []
        let _data = []

        for (var key in results) {

            if (results.hasOwnProperty(key)) {
    
                _labels.push(key)
                _data.push(results[key])
            }
        }


        let data = {
            labels: _labels,
              datasets: [
                {
                    label: 'Amount',
                    fill: true,
                    data: _data,
                    borderWidth: 1
                }
            ]
        }

        let options = {
	        plugins: {

	            datalabels: {
	                anchor: 'end',
	                align: 'top',
        			font: {
          				size: 11,
          				weight: 600
        			},
	            }
            },
	        title: {
	                  display: true,
	                  text: file,
	                  position: 'bottom'
	              },
	        scales: {
                xAxes: [{
                    gridLines: {
                        display: false
                    }                    
                }],
	            yAxes: [{
	                ticks: {
                        beginAtZero:true,
                        callback: function(label, index, labels) {
                            return label + ' ' + suffix
                        }
                    }
	            }]
	        }
        }
        
        this.myBarChart = new Chart(this.ctx, {
            type: 'bar',
            data: data,
            options: options
        })

        this.changeColor()

    }

    updateChart = (bgColor,fgColor) => {
        this.myBarChart.options.plugins.datalabels.color = fgColor
        this.myBarChart.data.datasets[0].backgroundColor = bgColor
        this.myBarChart.data.datasets[0].borderColor = fgColor
        this.myBarChart.data.datasets[0].labelColor = bgColor
        this.myBarChart.data.datasets[0].labelStrokeColor = fgColor
        this.myBarChart.update()
    }

    legendLabelPlugin = () => {
        Chart.plugins.register({
            beforeDraw: function (chart) {
                if (chart.config.data.datasets[0].labelColor) {
                    let legends = chart.legend.legendItems
                    legends.forEach(function (e, i) {
                        e.fillStyle = chart.config.data.datasets[i].labelColor
                        e.strokeStyle = chart.config.data.datasets[i].labelStrokeColor
                    })
                }
            }
        })
    }

    showWelcomePage = () => {
        this.welcomeCaption.setAttribute('style', 'display: block')
        this.mainContainer.setAttribute('style', 'display: none')
    }

    hideWelcomePage = () => {

        this.welcomeCaption.setAttribute('style', 'display: none')
        this.mainContainer.setAttribute('style', 'display: block')
    }
}

let main = new Main()
