class AwesomeGraph {
    constructor (id, segments) {
        this.canvasWidth = 300;
        this.canvasHeight = 300;
        this.context = null;
        this.radius = 80;
        this.center = 150;

        this.segments = 5;
        this.totalAngle = 1.5 * Math.PI;
        this.maxArea = 80;
        this.thickness = this.maxArea - 40;
        this.spacer = 0.03;
        this.maxValue = 900;
        this.animationProps = [];
        this.firstBuild = true;

        this.init(id, {segments : segments ? segments : this.segments});
    }
    calculate(arr, thickness = this.maxArea) {
        if(Array.isArray(arr)) {
            let newArr = [];
            for(let i = 0; i < this.segments; i++) {
                newArr.push(thickness*arr[i]/this.maxValue);
            }
            return newArr;
        }
        else return (arr/this.maxValue * this.totalAngle);
    }

    changeValuesToPoints(array) {
        let coordinates = [];
        let a,b,v,angle;
        for(let i = 0; i < this.segments; i++) {
            v = array[i] * this.radius / this.maxValue;
            angle = (1.5 * Math.PI) + i * ( 2 * Math.PI / this.segments);
            a = Math.abs(this.center + v * Math.cos(angle));
            b = Math.abs(this.center + v * Math.sin(angle));
            coordinates.push({x:a, y:b});
        }
        return coordinates;
    }

    drawSegmentedCircles(color, array = 0, radius = this.radius, area = this.maxArea) {
        let startAngle = 0.5 * Math.PI;
        for(let i = 0; i < this.segments; i++){
            let width = this.totalAngle / this.segments;
            // let spacer = i === this.segments.length - 1 ? 0 : this.spacer;
            let endAngle =  startAngle + width - this.spacer;
            this.context.beginPath();
            if(array === 0) this.context.arc(this.center, this.center, radius, startAngle , endAngle);
            else this.context.arc(this.center, this.center, radius + array[i]/2 - area/2, startAngle , endAngle);
            startAngle = endAngle + this.spacer;
            this.context.strokeStyle = color;
            if(array === 0) this.context.lineWidth = area;
            else this.context.lineWidth = array[i];
            this.context.stroke();
            this.context.closePath();
        }
    }

    drawAThreeQuarterCircle(color, radius = this.radius, value = this.totalAngle, thickness = this.thickness) {
        let startAngle = 0.5 * Math.PI;
        this.context.beginPath();
        this.context.arc(this.center, this.center, radius, startAngle , startAngle + value);
        this.context.strokeStyle = color;
        this.context.lineWidth = thickness;
        this.context.stroke();
        this.context.closePath();
    }

    drawFullCircle(radius, strokeColor, strokeWidth) {
        this.context.beginPath();
        this.context.arc(this.center, this.center, radius, 0 , 2 * Math.PI);
        this.context.strokeStyle = strokeColor;
        this.context.lineWidth = strokeWidth;
        this.context.stroke();
        this.context.closePath();
    }

    drawPolygon(color, width, coordinates) {
        this.context.beginPath();
        for(let i = 0; i < coordinates.length; i++) {
            this.context.moveTo(coordinates[i].x, coordinates[i].y);
            if(i === coordinates.length - 1) this.context.lineTo(coordinates[0].x, coordinates[0].y);
            else this.context.lineTo(coordinates[i+1].x, coordinates[i+1].y);
            this.context.strokeStyle = color;
            this.context.lineWidth = width;
            this.context.stroke();
        }
        this.context.closePath();
    }

    animatePie(time) {
        let props = [], a = [];
        for(let i = 0;  i< this.animationProps.length; i++) {
            if(!Array.isArray(this.animationProps[i])) {
                props.push(this.animationProps[i]);
                a.push(0);
            }
        }
        const animation = () => {
            this.context.clearRect(0,0,300,300);
            props.forEach( (prop, index) => {
                a[index] = a[index] + prop / time;
            });
            let anim = true;
            a.forEach( (ai, index) => {
                if(ai > props[index]) anim = false;
            });
            if(anim) {
                this.build(...a);
                window.requestAnimationFrame(animation);
            }
            else this.build(...props);
        };
        animation();
    }

    animatePolyAndBarGraph(time) {
        let arrays = [], a = [];
        for(let i = 0;  i< this.animationProps.length; i++) {
            if(Array.isArray(this.animationProps[i])) {
                arrays.push(this.animationProps[i]);
            }
        }
        const animation = () => {
            this.context.clearRect(0,0,300,300);
            arrays.forEach((props, i) => {
                props.forEach( (prop, index) => {
                    a.push(0);
                    a[index] = a[index] + prop / (time);
                });
                let anim = true;
                a.forEach( (ai, index) => {
                    if(ai > props[index]) anim = false;
                });
                if(anim) {
                    this.build(a);
                    window.requestAnimationFrame(animation);
                }
                else this.build(props);
            });
        };
        animation();
    }

    init(id, props) {
        this.segments = props.segments;
        let canvas = document.createElement("canvas");
        document.getElementById(id).append(canvas);
        canvas.width = this.canvasWidth;
        canvas.height = this.canvasHeight;
        this.context = canvas.getContext("2d");
        this.context.clearRect(0,0,this.canvasWidth,this.canvasHeight)
    }
}

class TypeOne extends AwesomeGraph{
    constructor (id, segments) {
        super(id, segments);
        this.foreground = 'rgb(206, 136, 186)';
        this.background = 'rgb(245, 231, 241)';
    }
    build(array, foregroundColor = this.foreground, backgroundColor = this.background) {
        this.drawSegmentedCircles(backgroundColor);
        this.drawSegmentedCircles(foregroundColor, this.calculate(array));
        if(this.firstBuild) {
            this.firstBuild = false;
            this.animationProps.push(array);
        }
        return this;
    }
    animate(time = 15) {
        this.animatePolyAndBarGraph(time);
        return this;
    }
}

class TypeTwo extends AwesomeGraph{
    constructor(id) {
        super(id);
        this.foreground = 'rgb(123, 146, 180)';
        this.background = 'rgb(229, 233, 240)';
    }
    drawGraph(color, value = this.totalAngle) {
        let startAngle = 0.5 * Math.PI;
        this.context.beginPath();
        this.context.arc(this.center, this.center, this.radius + 10, startAngle , startAngle + value);
        this.context.strokeStyle = color;
        this.context.lineWidth = this.maxArea - 20;
        this.context.stroke();
        this.context.closePath();
    }
    build(value, backgroundColor = this.background, foregroundColor = this.foreground) {
        this.drawGraph(backgroundColor);
        this.drawGraph(foregroundColor, this.calculate(value));
        if(this.firstBuild) {
            this.firstBuild = false;
            this.animationProps.push(value);
        }
        return this;
    }
    animate(time = 15) {
        this.animatePie(time);
        return this;
    }
}

class TypeThree extends AwesomeGraph{
    constructor(id, segments) {
        super(id, segments);
        this.foreground = 'rgb(245, 160, 78)';
        this.background = 'rgb(253, 236, 220)';
        this.outerThickness = this.maxArea - 40;
        this.innerThickness = this.maxArea - 55;
        this.outerRadius = this.radius + 20;
        this.innerRadius = this.radius - 20;
    }
    buildPie( pieChartValue, backgroundColor = this.background, foregroundColor = this.foreground) {
        this.drawAThreeQuarterCircle(backgroundColor, this.innerRadius, this.totalAngle, this.innerThickness);
        this.drawAThreeQuarterCircle(foregroundColor, this.innerRadius, this.calculate(pieChartValue), this.innerThickness);
    }
    buildSegmented (barGraphValue, backgroundColor = this.background, foregroundColor = this.foreground) {
        this.drawSegmentedCircles(backgroundColor, 0, this.outerRadius, this.outerThickness);
        this.drawSegmentedCircles(foregroundColor, this.calculate(barGraphValue, this.outerThickness), this.outerRadius, this.outerThickness);
    }
    buildPolygon(polygonValue, foregroundColor = this.foreground) {
        polygonValue = polygonValue.map( item => 2*item/3);
        this.drawPolygon(foregroundColor, 4, this.changeValuesToPoints(polygonValue));
    }
    build(barGraphValue, pieChartValue, polygonValue,
          backgroundColor = this.background,
          foregroundColor = this.foreground) {
        if(this.firstBuild) {
            this.firstBuild = false;
            this.animationProps.push(barGraphValue);
            this.animationProps.push(pieChartValue);
            this.animationProps.push(polygonValue);
        }
        this.buildPie(pieChartValue, backgroundColor, foregroundColor);
        this.buildSegmented(barGraphValue, backgroundColor, foregroundColor);
        this.buildPolygon(polygonValue, foregroundColor);
        return this;
    }

    animatePie(time) {
        this.context.clearRect(0,0,300,300);
        let props = this.animationProps[1], i = 0;
        const animation = () => {
            i = i + props / time;
            if (i <= props) {
                this.buildPie(i);
                window.requestAnimationFrame(animation);
            }
            else this.buildPie(props);
        };
        animation();
    }
    animatePolyAndBarGraph(time) {
        let arrays = [], a = [];
        for(let i = 0;  i< this.animationProps.length; i++) {
            if(Array.isArray(this.animationProps[i])) {
                arrays.push(this.animationProps[i]);
            }
        }
        const animation = () => {
            arrays.forEach((props, i) => {
                props.forEach( (prop, index) => {
                    a.push(0);
                    a[index] = a[index] + prop / (time);
                });
                let anim = true;
                a.forEach( (ai, index) => {
                    if(ai > props[index]) anim = false;
                });
                this.context.clearRect(0,0,300,300);
                if(anim) {
                    this.buildSegmented(a);
                    this.buildPolygon(a);
                    window.requestAnimationFrame(animation);
                }
                else {
                    this.buildSegmented(props);
                    this.buildPolygon(props);
                }
            });
        };
        animation();
    }
    animate(pieChartTime = 18, polygonBarGraphTime = 30) {
        this.animatePie(pieChartTime);
        this.animatePolyAndBarGraph(polygonBarGraphTime);
        return this;
    }

}

class TypeFour extends AwesomeGraph{
    constructor(id, segments) {
        super(id, segments);
        this.radius = 120;
        this.circleColor = 'rgb(1, 103, 143)';
        this.linesColor = 'rgb(226, 226, 228)';
        this.foregroundPolygonColor = 'rgb(103, 197, 202)';
        this.backgroundPolygonColor = 'rgb(249, 250, 252)';
    }
    drawLinesFromOrigin(color, width, coordinates) {
        this.context.beginPath();
        for(let i = 0; i < coordinates.length; i++) {
            this.context.moveTo(this.center,this.center);
            this.context.lineTo(coordinates[i].x, coordinates[i].y);
            this.context.strokeStyle = color;
            this.context.lineWidth = width;
            this.context.stroke();
        }
        this.context.closePath();
    }
    regularPolygonCoordinates() {
        let a, b, angle, coordinates = [];
        for(let i = 0; i < this.segments; i++) {
            angle = (1.5 * Math.PI) + i * ( 2 * Math.PI / this.segments);
            a = Math.abs(this.center + this.radius * Math.cos(angle));
            b = Math.abs(this.center + this.radius * Math.sin(angle));
            coordinates.push({x:a, y:b});
        }
        return coordinates;
    }
    drawBackground(circlesColor, backgroundPolygonColor , linesColor) {
        for(let i = 0; i < 10; i++) {
            this.drawFullCircle(this.radius - 10 * i, circlesColor, 0.5)
        }
        let coordinates = this.regularPolygonCoordinates();
        this.drawPolygon(backgroundPolygonColor, 1, coordinates);
        this.drawLinesFromOrigin(linesColor, 2, coordinates);
    }
    insertValues(values, foregroundPolygonColor) {
        this.drawPolygon(foregroundPolygonColor, 5, this.changeValuesToPoints(values))
    }
    build(values,
          circlesColor = this.circleColor,
          backgroundPolygonColor = this.backgroundPolygonColor,
          linesColor = this.linesColor,
          foregroundPolygonColor = this.foregroundPolygonColor) {

        this.drawBackground(circlesColor, backgroundPolygonColor , linesColor);
        this.insertValues(values, foregroundPolygonColor);
        if(this.firstBuild) {
            this.firstBuild = false;
            this.animationProps.push(values);
        }
        return this;
    }
    animate(time = 15) {
        this.animatePolyAndBarGraph(time);
        return this;
    }
}

class TypeFive extends AwesomeGraph{
    constructor(id, segments) {
        super(id, segments);
        this.radius = 120;
        this.gap = 47;
        this.backgroundColor = 'rgb(253, 236, 220)';
        this.foregroundColor = 'rgb(245, 160, 78)';
    }
    build(value1,
          value2,
          backgroundColor = this.backgroundColor,
          foregroundColor = this.foregroundColor) {
        if(this.firstBuild) {
            this.firstBuild = false;
            this.animationProps.push(value1);
            this.animationProps.push(value2);
        }
        this.drawAThreeQuarterCircle(backgroundColor);
        this.drawAThreeQuarterCircle(backgroundColor, this.radius - this.gap);
        this.drawAThreeQuarterCircle(foregroundColor, this.radius, this.calculate(value1));
        this.drawAThreeQuarterCircle(foregroundColor, this.radius - this.gap, this.calculate(value2));        return this;
    }
    animate(time = 15) {
        this.animatePie(time);
        return this;
    }
}