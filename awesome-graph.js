class AwesomeGraph {
    constructor(id) {
        this.id = id;
        this.multiplier = 2;
        this.canvasWidth = 300 * this.multiplier;
        this.canvasHeight = 300 * this.multiplier;
        this.context = null;
        this.center = this.canvasHeight / 2;
        this.radius = 7 * this.center / 12;

        this.foreground = "";
        this.background = "";

        this.segments = 5;
        this.totalAngle = 1.5 * Math.PI;
        this.maxArea = this.radius / 2;
        this.thickness = this.maxArea / 2;
        this.spacer = 0.03;
        this.maxValue = 900;
        this.animationProps = [];
        this.labels = [];
        this.firstBuild = true;
    }

    calculate(data, thickness = this.maxArea) {
        if (Array.isArray(data)) {
            let newValues = [];
            for (let i = 0; i < this.segments; i++) {
                newValues.push(thickness * data[i] / this.maxValue);
            }
            return newValues;
        } else return (data / this.maxValue * this.totalAngle);
    }

    changeValuesToPoints(array) {
        let coordinates = [];
        let a, b, v, angle;
        for (let i = 0; i < this.segments; i++) {
            v = array[i] * this.radius / this.maxValue;
            angle = (1.5 * Math.PI) + i * (2 * Math.PI / this.segments);
            a = Math.abs(this.center + v * Math.cos(angle));
            b = Math.abs(this.center + v * Math.sin(angle));
            coordinates.push({x: a, y: b});
        }
        return coordinates;
    }

    drawSegmentedCircles(color, array = 0, radius = this.radius, area = this.maxArea,startAngle = 0.5 * Math.PI) {
        for (let i = 0; i < this.segments; i++) {
            let width = this.totalAngle / this.segments;
            let endAngle = startAngle + width - this.spacer;
            this.context.beginPath();
            if (array === 0) this.context.arc(this.center, this.center, radius, startAngle, endAngle);
            else this.context.arc(this.center, this.center, radius + (array[i] === 0 ? 0.1 : array[i]) / 2 - area / 2, startAngle, endAngle);
            startAngle = endAngle + this.spacer;
            this.context.strokeStyle = color;
            if (array === 0) this.context.lineWidth = area;
            else this.context.lineWidth = array[i] === 0 ? 0.1 : array[i];
            this.context.stroke();
            this.context.closePath();
        }
    }

    drawAThreeQuarterCircle(color, radius = this.radius, value = this.totalAngle, thickness = this.thickness, startAngle = 0.5 * Math.PI) {
        this.context.beginPath();
        this.context.arc(this.center, this.center, radius, startAngle, startAngle + value);
        this.context.strokeStyle = color;
        this.context.lineWidth = thickness;
        this.context.stroke();
        this.context.closePath();
    }

    drawFullCircle(radius, strokeColor, strokeWidth) {
        this.context.beginPath();
        this.context.arc(this.center, this.center, radius, 0, 2 * Math.PI);
        this.context.strokeStyle = strokeColor;
        this.context.lineWidth = strokeWidth;
        this.context.stroke();
        this.context.closePath();
    }

    drawPolygon(color, width, coordinates) {
        this.context.beginPath();
        this.context.moveTo(coordinates[0].x, coordinates[0].y);
        this.context.lineJoin = "round";
        for (let i = 0; i < coordinates.length; i++) {
            if (i === coordinates.length - 1) this.context.lineTo(coordinates[0].x, coordinates[0].y);
            else this.context.lineTo(coordinates[i + 1].x, coordinates[i + 1].y);
        }
        this.context.closePath();
        this.context.strokeStyle = color;
        this.context.lineWidth = width;
        this.context.stroke();
    }

    animatePie(time, type = 0) {
        let props = [], a = [];
        for (let i = 0; i < this.animationProps.length; i++) {
            if (!Array.isArray(this.animationProps[i])) {
                props.push(this.animationProps[i]);
                a.push(0);
            }
        }
        const animation = () => {
            this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            props.forEach((prop, index) => {
                a[index] = a[index] + (prop === 0 ? 0.1 : prop) / time;
            });
            let anim = true;
            a.forEach((ai, index) => {
                if (ai > props[index]) anim = false;
            });
            this.showTotal();
            this.showType();
            if (anim) {
                let b = a;
                if(type === 6) b = a.map(item => item * 100 / this.maxValue);
                this.build(...b);
                window.requestAnimationFrame(animation);
            } else {
                if(type === 6) props = props.map(item => item * 100 / this.maxValue);
                this.build(...props);
            }
        };
        animation();
    }

    animatePolyAndBarGraph(time) {
        let arrays = [], a = [];
        for (let i = 0; i < this.animationProps.length; i++) {
            if (Array.isArray(this.animationProps[i])) {
                arrays.push(this.animationProps[i]);
            }
        }
        const animation = () => {
            this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            arrays.forEach((props, i) => {
                props.forEach((prop, index) => {
                    prop = prop === 0 ? 0.1 : prop;
                    a.push(0);
                    a[index] = a[index] + prop / (time);
                });
                let anim = true;
                a.forEach((ai, index) => {
                    if (ai > props[index]) anim = false;
                });
                if (anim) {
                    this.build(a);
                    window.requestAnimationFrame(animation);
                } else this.build(props);
                this.setLabels(this.labels);
                this.showTotal();
                this.showType();
            });
        };
        animation();
    }


    build() {
        this.init(this.id);
        return this;
    }

    setMaxValue(maxValue) {
        this.maxValue = maxValue;
        return this;
    }

    setMultiplier(multiplier) {
        this.multiplier = multiplier;
        return this;
    }

    setSegments(segments) {
        this.segments = segments;
        return this;
    }

    setLabels() {
    }

    showTotal() {
    }

    showTotalMethod(total, position, font = "Roboto, sans-serif") {
        let average = 0;
        let fontSizeLg = 36 * this.multiplier;
        let fontSizeSm = 16 * this.multiplier;
        total.map(item => average = average + item);
        average = parseInt(average / total.length);
        this.context.font = "normal normal bold "+ fontSizeLg +"px " + font;
        this.context.fillStyle = "#000";
        if (position === "center") {
            this.context.textAlign = "center";
            this.context.fillText(average, this.center, this.center + 10 * this.multiplier);
            this.context.font = "normal normal 300 "+ fontSizeSm +"px " + font;
            this.context.fillText("/ " + this.maxValue, this.center + 5 * this.multiplier, this.center + 35 * this.multiplier);
        }
        if (position === "bottom") {
            this.context.fillText(average, this.center + 10 * this.multiplier, this.center + 75 * this.multiplier);
            this.context.font = "normal normal 300 "+ fontSizeSm +"px " + font;
            this.context.fillText("/ "+this.maxValue, this.center + 30 * this.multiplier, this.center + 95 * this.multiplier);
        }

    }

    showType() {
    }

    showTypeMethod(data) {
        this.context.beginPath();
        this.context.fillStyle = this.foreground;
        this.context.lineWidth = 1;
        let x1 = 140 * this.multiplier, y1 = 100 * this.multiplier;
        let x2 = 160 * this.multiplier, y2 = 120 * this.multiplier;
        let borderRadius = 4 * this.multiplier;
        let fontSize = 14 * this.multiplier;
        this.context.moveTo(x1 + borderRadius, y1);
        this.context.lineTo(x2 - borderRadius,y1);
        this.context.quadraticCurveTo(x2,y1,x2,y1 + borderRadius);
        this.context.lineTo(x2,y2 - borderRadius);
        this.context.quadraticCurveTo(x2,y2,x2 - borderRadius,y2);
        this.context.lineTo(x1 + borderRadius,y2);
        this.context.quadraticCurveTo(x1,y2,x1,y2 - borderRadius);
        this.context.lineTo(x1,y1 + borderRadius);
        this.context.quadraticCurveTo(x1,y1,x1 + borderRadius,y1);
        this.context.closePath();
        this.context.fill();
        this.context.fillStyle = "#FFF";
        this.context.font = "normal normal bold "+fontSize+"px Roboto";
        this.context.textAlign = "center";
        this.context.fillText(data, this.center, this.center - 35 * this.multiplier);

    }


    init(id) {
        let canvas = document.createElement("canvas");
        document.getElementById(id).innerHTML = "";
        document.getElementById(id).append(canvas);
        this.canvasWidth = 300 * this.multiplier;
        this.canvasHeight = 300 * this.multiplier;
        this.center = this.canvasHeight / 2;
        this.radius = 7 * this.center / 12;
        this.maxArea = this.radius / 2;
        this.thickness = -2 * this.multiplier +2 * this.maxArea / 3;
        canvas.width = this.canvasWidth;
        canvas.height = this.canvasHeight;
        this.context = canvas.getContext("2d");
        this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
}

class TypeOne extends AwesomeGraph {
    constructor(id) {
        super(id);
        this.radius = this.radius + 5 * this.multiplier ;
        this.maxArea = this.maxArea - 30 * this.multiplier;
        this.foreground = 'rgb(206, 136, 186)';
        this.background = 'rgb(245, 231, 241)';
    }

    setLabels(array, font = "Roboto") {
        this.labels = array;
        let width = this.totalAngle / this.segments;
        let angle = 0.5 * Math.PI + width / 2;
        let fontSize = 22 * this.multiplier;
        let x, y;
        for (let i = 0; i < this.segments; i++) {
            x = Math.abs((this.radius + 43 * this.multiplier) * Math.cos(angle) + this.center);
            y = Math.abs((this.radius + 43 * this.multiplier) * Math.sin(angle) + this.center + 5 * this.multiplier);
            this.context.font = fontSize+"px " + font;
            this.context.textAlign = "center";
            this.context.fillStyle = this.foreground;
            this.context.fillText(array[i], x, y);
            angle = angle + width;
        }
        return this;
    }

    build(array, foregroundColor = this.foreground, backgroundColor = this.background) {
        super.build();
        this.drawSegmentedCircles(backgroundColor);
        this.drawSegmentedCircles(foregroundColor, this.calculate(array));
        if (this.firstBuild) {
            this.firstBuild = false;
            this.animationProps.push(array);
        }
        this.showTotal();
        return this;
    }

    showTotal() {
        this.showTotalMethod(this.animationProps[0], "center");
    }

    showType() {
        this.showTypeMethod("A");
    }

    animate(time = 15) {
        this.animatePolyAndBarGraph(time);
        return this;
    }
}

class TypeTwo extends AwesomeGraph {
    constructor(id) {
        super(id);
        this.foreground = 'rgb(123, 146, 180)';
        this.background = 'rgb(229, 233, 240)';
    }

    build(value, backgroundColor = this.background, foregroundColor = this.foreground) {
        super.build();
        this.drawAThreeQuarterCircle(backgroundColor, this.radius + 5 * this.multiplier, this.totalAngle, this.maxArea - 5 * this.multiplier);
        this.drawAThreeQuarterCircle(foregroundColor, this.radius + 5 * this.multiplier, this.calculate(value), this.maxArea - 5 * this.multiplier);
        if (this.firstBuild) {
            this.firstBuild = false;
            this.animationProps.push(value);
        }
        this.showTotal();
        this.showType();
        return this;
    }

    showType() {
        this.showTypeMethod("E");
    }

    showTotal() {
        this.showTotalMethod(this.animationProps, "center");
    }

    animate(time = 15) {
        this.animatePie(time);
        return this;
    }
}

class TypeThree extends AwesomeGraph {
    constructor(id) {
        super(id);
        this.foreground = 'rgb(245, 160, 78)';
        this.background = 'rgb(253, 236, 220)';
    }

    setValues() {
        this.outerThickness = this.maxArea - 10 * this.multiplier;
        this.innerThickness = this.maxArea - 20 * this.multiplier;
        this.outerRadius = this.radius + 10 * this.multiplier;
        this.innerRadius = this.radius - this.outerThickness + 5 * this.multiplier;
    }

    buildPie(pieChartValue, backgroundColor = this.background, foregroundColor = this.foreground) {
        this.drawAThreeQuarterCircle(backgroundColor, this.innerRadius, this.totalAngle, this.innerThickness);
        this.drawAThreeQuarterCircle(foregroundColor, this.innerRadius, this.calculate(pieChartValue), this.innerThickness);
    }

    buildSegmented(barGraphValue, backgroundColor = this.background, foregroundColor = this.foreground) {
        this.drawSegmentedCircles(backgroundColor, 0, this.outerRadius, this.outerThickness);
        this.drawSegmentedCircles(foregroundColor, this.calculate(barGraphValue, this.outerThickness), this.outerRadius, this.outerThickness);
    }

    buildPolygon(polygonValue, foregroundColor = this.foreground) {
        polygonValue = polygonValue.map(item => item / 2);
        this.drawPolygon(foregroundColor, 3 * this.multiplier, this.changeValuesToPoints(polygonValue));
    }

    build(barGraphValue, pieChartValue, polygonValue,
          backgroundColor = this.background,
          foregroundColor = this.foreground) {
        super.build();
        this.setValues();
        if (this.firstBuild) {
            this.firstBuild = false;
            this.animationProps.push(barGraphValue);
            this.animationProps.push(pieChartValue);
            this.animationProps.push(polygonValue);
        }
        this.buildPie(pieChartValue, backgroundColor, foregroundColor);
        this.buildSegmented(barGraphValue, backgroundColor, foregroundColor);
        this.buildPolygon(polygonValue, foregroundColor);
        this.showTotal();
        return this;
    }

    showTotal() {
        this.showTotalMethod(this.animationProps[0], "bottom");
    }

    animate(pieChartTime = 18, polygonBarGraphTime = 20) {
        let props = this.animationProps;
        let barAnimatedValues = [];
        let polygonAnimatedValues = [];
        let pieAnimatedValue = 0;
        let isAnimationPossible = [true, true, true];
        const animation = () => {
            this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            props[0].forEach((prop, index) => {
                prop = prop === 0 ? 0.1 : prop;
                barAnimatedValues.push(0);
                barAnimatedValues[index] = barAnimatedValues[index] + prop / (polygonBarGraphTime);
            });
            barAnimatedValues.forEach((value, index) => {
                if (value > props[0][index]) isAnimationPossible[0] = false;
            });
            pieAnimatedValue = pieAnimatedValue + props[1] / pieChartTime;
            if (pieAnimatedValue > props[1]) {
                isAnimationPossible[1] = false;
            }
            props[2].forEach((prop, index) => {
                prop = prop === 0 ? 0.1 : prop;
                polygonAnimatedValues.push(0);
                polygonAnimatedValues[index] = polygonAnimatedValues[index] + prop / (polygonBarGraphTime);
            });
            polygonAnimatedValues.forEach((value, index) => {
                if (value > props[2][index]) isAnimationPossible[2] = false;
            });

            if (isAnimationPossible[0] || isAnimationPossible[1] || isAnimationPossible[2]) {
                if (isAnimationPossible[0]) this.buildSegmented(barAnimatedValues);
                else this.buildSegmented(props[0]);
                if (isAnimationPossible[1]) this.buildPie(pieAnimatedValue);
                else this.buildPie(props[1]);
                if (isAnimationPossible[2]) this.buildPolygon(polygonAnimatedValues);
                else this.buildPolygon(props[2]);
                window.requestAnimationFrame(animation);
            } else {
                this.buildSegmented(props[0]);
                this.buildPie(props[1]);
                this.buildPolygon(props[2]);
            }
            this.showTotal(props[0], "bottom");
        };
        animation();
        return this;
    }
}

class TypeFour extends AwesomeGraph {
    constructor(id) {
        super(id);
        this.radius = 110;
        this.circleColor = 'rgb(1, 103, 143)';
        this.linesColor = 'rgb(226, 226, 228)';
        this.foregroundPolygonColor = 'rgb(103, 197, 202)';
        this.backgroundPolygonColor = 'rgb(249, 250, 252)';
    }

    drawLinesFromOrigin(color, width, coordinates) {
        this.context.beginPath();
        for (let i = 0; i < coordinates.length; i++) {
            this.context.moveTo(this.center, this.center);
            this.context.lineTo(coordinates[i].x, coordinates[i].y);
            this.context.strokeStyle = color;
            this.context.lineWidth = width * this.multiplier;
            this.context.stroke();
        }
        this.context.closePath();
    }

    regularPolygonCoordinates() {
        let a, b, angle, coordinates = [];
        for (let i = 0; i < this.segments; i++) {
            angle = (1.5 * Math.PI) + i * (2 * Math.PI / this.segments);
            a = Math.abs(this.center + this.radius * Math.cos(angle));
            b = Math.abs(this.center + this.radius * Math.sin(angle));
            coordinates.push({x: parseInt(a), y: parseInt(b)});
        }
        return coordinates;
    }

    drawBackground(circlesColor, backgroundPolygonColor, linesColor) {
        for (let i = 0; i < 10; i++) {
            this.drawFullCircle(this.radius - 8 * i * this.multiplier, circlesColor, 0.5 * this.multiplier)
        }
        let coordinates = this.regularPolygonCoordinates();
        this.drawPolygon(backgroundPolygonColor, this.multiplier, coordinates);
        this.drawLinesFromOrigin(linesColor, this.multiplier, coordinates);
    }

    insertValues(values, foregroundPolygonColor) {
        this.drawPolygon(foregroundPolygonColor, 5 * this.multiplier, this.changeValuesToPoints(values))
    }

    setLabels(array, font = "Roboto") {
        this.labels = array;
        let coordinates = this.regularPolygonCoordinates();
        let fontSize = 22 * this.multiplier;
        for (let i = 0; i < this.segments; i++) {
            let shiftX = coordinates[i].x >= this.center ? 20 * this.multiplier : -15 * this.multiplier;
            let shiftY = coordinates[i].y >= this.center ? 20 * this.multiplier : -15 * this.multiplier;
            if (coordinates[i].x > this.center - 5 * this.multiplier && coordinates[i].x < this.center + 5 * this.multiplier) shiftX = 0;
            if (coordinates[i].y > this.center - 5 * this.multiplier && coordinates[i].y < this.center + 5 * this.multiplier) shiftY = 0;
            let x = coordinates[i].x + shiftX;
            let y = coordinates[i].y + shiftY;
            this.context.font = fontSize+"px " + font;
            this.context.fillStyle = this.foregroundPolygonColor;
            this.context.textAlign = "center";
            this.context.fillText(array[i], x, y);
        }
        return this;
    }

    build(values,
          circlesColor = this.circleColor,
          backgroundPolygonColor = this.backgroundPolygonColor,
          linesColor = this.linesColor,
          foregroundPolygonColor = this.foregroundPolygonColor) {

        super.build();
        this.drawBackground(circlesColor, backgroundPolygonColor, linesColor);
        this.insertValues(values, foregroundPolygonColor);
        if (this.firstBuild) {
            this.firstBuild = false;
            this.animationProps.push(values);
        }
        return this;
    }

    animate(time = 15) {
        this.animatePolyAndBarGraph(time, false);
        return this;
    }
}

class TypeFive extends AwesomeGraph {
    constructor(id) {
        super(id);
        this.backgroundColor = 'rgb(253, 236, 220)';
        this.foregroundColor = 'rgb(245, 160, 78)';
    }

    setValues() {
        this.radius += 20 * this.multiplier;
        this.gap = 35 * this.multiplier;
    }

    build(value1,
          value2,
          backgroundColor = this.backgroundColor,
          foregroundColor = this.foregroundColor) {
        super.build();
        this.setValues();
        if (this.firstBuild) {
            this.firstBuild = false;
            this.animationProps.push(value1);
            this.animationProps.push(value2);
        }
        this.drawAThreeQuarterCircle(backgroundColor);
        this.drawAThreeQuarterCircle(backgroundColor, this.radius - this.gap);
        this.drawAThreeQuarterCircle(foregroundColor, this.radius, this.calculate(value1));
        this.drawAThreeQuarterCircle(foregroundColor, this.radius - this.gap, this.calculate(value2));
        return this;
    }

    animate(time = 15) {
        this.animatePie(time, false);
        return this;
    }
}

class TypeSix extends AwesomeGraph {
    constructor(id) {
        super(id);
        this.foreground = 'rgb(123, 146, 180)';
        this.background = 'rgb(229, 233, 240)';
        this.value = 0;
    }

    drawGaps(gaps, startAngle){
        for (let i = 1; i <= gaps; i++) {
            this.context.beginPath();
            let angle = startAngle + i * (this.totalAngle/ (gaps + 1));
            let a1 = this.center + (this.radius - this.maxArea / 2 - 1) * Math.cos(angle);
            let b1 = this.center + (this.radius - this.maxArea / 2 - 1) * Math.sin(angle);
            let a2 = this.center + (this.radius + this.maxArea / 2 + 1) * Math.cos(angle);
            let b2 = this.center + (this.radius + this.maxArea / 2 + 1) * Math.sin(angle);
            this.context.moveTo(a1,b1);
            this.context.lineTo(a2,b2);
            this.context.strokeStyle = "#FFF";
            this.context.lineWidth = 2 * this.multiplier;
            this.context.stroke();
            this.context.closePath();
        }
    }

    build(value, foregroundColor = this.foreground, backgroundColor = this.background) {
        super.build();
        this.segments = 3;
        let uncalculatedValue = value * this.maxValue / 100;
        this.drawAThreeQuarterCircle(backgroundColor, this.radius, this.totalAngle, this.maxArea, 0.75 * Math.PI);
        this.drawAThreeQuarterCircle(foregroundColor, this.radius, this.calculate(uncalculatedValue), this.maxArea, 0.75 * Math.PI);
        if (this.firstBuild) {
            this.value = value;
            this.firstBuild = false;
            this.animationProps.push(uncalculatedValue);
        }
        this.drawGaps(this.segments - 1,0.75 * Math.PI);
        this.showTotal();
        return this;
    }

    showTotal() {
        let fontSizeLg = 36 * this.multiplier;
        let fontSizeSm = 16 * this.multiplier;
        this.context.font = "normal normal bold "+ fontSizeLg +"px Roboto";
        this.context.fillStyle = "#000";
        this.context.textAlign = "right";
        this.context.fillText(this.value, this.center + 15 * this.multiplier, this.center + 10 * this.multiplier);
        this.context.font = "normal normal 300 "+ fontSizeSm +"px Roboto";
        this.context.textAlign = "left";
        this.context.fillText("%", this.center + 17 * this.multiplier, this.center + 7 * this.multiplier);
    }

    animate(time = 15) {
        this.animatePie(time, 6);
        return this;
    }
}


