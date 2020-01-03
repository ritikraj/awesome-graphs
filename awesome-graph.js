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
        this.showTotal();
        this.drawAThreeQuarterCircle(backgroundColor);
        this.drawAThreeQuarterCircle(backgroundColor, this.radius - this.gap);
        this.drawAThreeQuarterCircle(foregroundColor, this.radius, this.calculate(value1));
        this.drawAThreeQuarterCircle(foregroundColor, this.radius - this.gap, this.calculate(value2));
        return this;
    }
    showTotal() {
        this.drawCentralImage()
    }
    drawCentralImage() {
        const imgdata = "data:image/png;base64,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";
        let img = new Image();
        img.onload = () => {
            this.context.drawImage(img,this.center - 50,this.center - 50, 100, 100); // Or at whatever offset you like
        };
        img.src = imgdata;
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