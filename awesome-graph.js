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
                if (type === 6) b = a.map(item => item * 100 / this.maxValue);
                this.build(...b);
                window.requestAnimationFrame(animation);
            } else {
                if (type === 6) props = props.map(item => item * 100 / this.maxValue);
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

    drawSegmentedCircles(color, array = 0, radius = this.radius, area = this.maxArea, startAngle = 0.5 * Math.PI) {
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

    setLabels() {
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

    showTotal() {
    }

    showTotalMethod(total, position, score = null, font = "Roboto, sans-serif") {
        let average = 0;
        let fontSizeLg = 36 * this.multiplier;
        let fontSizeSm = 16 * this.multiplier;
        if (score) average = score;
        else {
            total.map(item => average = average + item);
            average = parseInt(average / total.length);
        }
        this.context.font = "normal normal bold " + fontSizeLg + "px " + font;
        this.context.fillStyle = "#000";
        if (position === "center") {
            this.context.textAlign = "center";
            this.context.fillText(average, this.center, this.center + 10 * this.multiplier);
            this.context.font = "normal normal 300 " + fontSizeSm + "px " + font;
            this.context.fillText("/ " + this.maxValue, this.center + 5 * this.multiplier, this.center + 35 * this.multiplier);
        }
        if (position === "bottom") {
            this.context.fillText(average, this.center + 10 * this.multiplier, this.center + 75 * this.multiplier);
            this.context.font = "normal normal 300 " + fontSizeSm + "px " + font;
            this.context.fillText("/ " + this.maxValue, this.center + 30 * this.multiplier, this.center + 95 * this.multiplier);
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
        this.context.lineTo(x2 - borderRadius, y1);
        this.context.quadraticCurveTo(x2, y1, x2, y1 + borderRadius);
        this.context.lineTo(x2, y2 - borderRadius);
        this.context.quadraticCurveTo(x2, y2, x2 - borderRadius, y2);
        this.context.lineTo(x1 + borderRadius, y2);
        this.context.quadraticCurveTo(x1, y2, x1, y2 - borderRadius);
        this.context.lineTo(x1, y1 + borderRadius);
        this.context.quadraticCurveTo(x1, y1, x1 + borderRadius, y1);
        this.context.closePath();
        this.context.fill();
        this.context.fillStyle = "#FFF";
        this.context.font = "normal normal bold " + fontSize + "px Roboto";
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
        this.thickness = -2 * this.multiplier + 2 * this.maxArea / 3;
        canvas.width = this.canvasWidth;
        canvas.height = this.canvasHeight;
        this.context = canvas.getContext("2d");
        this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
}

class TypeOne extends AwesomeGraph {
    constructor(id) {
        super(id);
        this.radius = this.radius + 5 * this.multiplier;
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
            this.context.font = fontSize + "px " + font;
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
            this.background = backgroundColor;
            this.foreground = foregroundColor;
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
            this.background = backgroundColor;
            this.foreground = foregroundColor;
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
        this.score = null;
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

    build(barGraphValue, pieChartValue, polygonValue, score = null, backgroundColor = this.background, foregroundColor = this.foreground) {
        super.build();
        this.setValues();
        if (this.firstBuild) {
            if (score) this.score = score;
            this.firstBuild = false;
            this.background = backgroundColor;
            this.foreground = foregroundColor;
            this.animationProps.push(barGraphValue);
            this.animationProps.push(pieChartValue);
            this.animationProps.push(polygonValue);
        }
        this.buildPie(pieChartValue, backgroundColor, foregroundColor);
        this.buildSegmented(barGraphValue, backgroundColor, foregroundColor);
        this.buildPolygon(polygonValue, foregroundColor);
        if (this.score !== null) this.showTotalMethod(0, "bottom", this.score);
        else this.showTotal();
        return this;
    }

    showTotal() {
        this.showLogo();
    }

    showLogo() {
        const imgData = "data:image/png;base64,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gAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJiBAYtQOESBAgAABAgQIECAgQGyAAAECBAgQIECAAIGYgACJUTtEgAABAgQIECBAgIAAsQECBAgQIECAAAECBGICAiRG7RABAgQIECBAgAABAgLEBggQIECAAAECBAgQiAkIkBi1QwQIECBAgAABAgQICBAbIECAAAECBAgQIEAgJvC/0pwgLchht7AAAAAASUVORK5CYII=";
        let img = new Image();
        img.onload = () => {
            this.context.drawImage(img, this.center + 15 * this.multiplier, this.center + 50 * this.multiplier, 120 * this.multiplier, 120 * this.multiplier);
        };
        img.src = imgData;
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
            if (this.score) this.showTotalMethod(0, "bottom", this.score);
            else this.showTotal(props[0], "bottom");
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
            this.context.font = fontSize + "px " + font;
            this.context.fillStyle = this.foregroundPolygonColor;
            this.context.textAlign = "center";
            this.context.fillText(array[i], x, y);
        }
        return this;
    }

    build(values, circlesColor = this.circleColor, backgroundPolygonColor = this.backgroundPolygonColor, linesColor = this.linesColor, foregroundPolygonColor = this.foregroundPolygonColor) {

        super.build();
        this.drawBackground(circlesColor, backgroundPolygonColor, linesColor);
        this.insertValues(values, foregroundPolygonColor);
        if (this.firstBuild) {
            this.firstBuild = false;
            this.circleColor = circlesColor;
            this.linesColor = linesColor;
            this.foregroundPolygonColor = foregroundPolygonColor;
            this.backgroundPolygonColor = backgroundPolygonColor;
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

    build(value1, value2 = null, backgroundColor = this.backgroundColor, foregroundColor = this.foregroundColor) {
        super.build();
        this.setValues();
        if (this.firstBuild) {
            this.firstBuild = false;
            this.background = backgroundColor;
            this.foreground = foregroundColor;
            this.animationProps.push(value1);
            this.animationProps.push(value2);
        }
        this.showTotal();
        this.drawAThreeQuarterCircle(backgroundColor);
        this.drawAThreeQuarterCircle(foregroundColor, this.radius, this.calculate(value1));
        if (value2 !== null) {
            this.drawAThreeQuarterCircle(backgroundColor, this.radius - this.gap);
            this.drawAThreeQuarterCircle(foregroundColor, this.radius - this.gap, this.calculate(value2));
        }
        return this;
    }

    showTotal() {
        this.drawCentralImage()
    }

    drawCentralImage() {
        const imgdata = "data:image/png;base64,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";
        let img = new Image();
        img.onload = () => {
            this.context.drawImage(img, this.center - 25 * this.multiplier, this.center - 25 * this.multiplier, 50 * this.multiplier, 50 * this.multiplier); // Or at whatever offset you like
        };
        img.src = imgdata;
    }

    animate(time = 15) {
        this.animatePie(time);
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

    drawGaps(gaps, startAngle) {
        for (let i = 1; i <= gaps; i++) {
            this.context.beginPath();
            let angle = startAngle + i * (this.totalAngle / (gaps + 1));
            let a1 = this.center + (this.radius - this.maxArea / 2 - 1) * Math.cos(angle);
            let b1 = this.center + (this.radius - this.maxArea / 2 - 1) * Math.sin(angle);
            let a2 = this.center + (this.radius + this.maxArea / 2 + 1) * Math.cos(angle);
            let b2 = this.center + (this.radius + this.maxArea / 2 + 1) * Math.sin(angle);
            this.context.moveTo(a1, b1);
            this.context.lineTo(a2, b2);
            this.context.strokeStyle = "#FFF";
            this.context.lineWidth = 2 * this.multiplier;
            this.context.stroke();
            this.context.closePath();
        }
    }

    build(value, foregroundColor = this.foreground, backgroundColor = this.background) {
        super.build();
        this.segments = 3;
        this.background = backgroundColor;
        this.foreground = foregroundColor;
        let uncalculatedValue = value * this.maxValue / 100;
        this.drawAThreeQuarterCircle(backgroundColor, this.radius, this.totalAngle, this.maxArea, 0.75 * Math.PI);
        this.drawAThreeQuarterCircle(foregroundColor, this.radius, this.calculate(uncalculatedValue), this.maxArea, 0.75 * Math.PI);
        if (this.firstBuild) {
            this.firstBuild = false;
            this.value = value;
            this.animationProps.push(uncalculatedValue);
        }
        this.drawGaps(this.segments - 1, 0.75 * Math.PI);
        this.showTotal();
        return this;
    }

    showTotal() {
        let fontSizeLg = 36 * this.multiplier;
        let fontSizeSm = 16 * this.multiplier;
        this.context.font = "normal normal bold " + fontSizeLg + "px Roboto";
        this.context.fillStyle = "#000";
        this.context.textAlign = "right";
        this.context.fillText(this.value, this.center + 15 * this.multiplier, this.center + 10 * this.multiplier);
        this.context.font = "normal normal 300 " + fontSizeSm + "px Roboto";
        this.context.textAlign = "left";
        this.context.fillText("%", this.center + 17 * this.multiplier, this.center + 7 * this.multiplier);
    }

    animate(time = 15) {
        this.animatePie(time, 6);
        return this;
    }
}

class TypeSeven extends AwesomeGraph {
    constructor(id) {
        super(id);
        this.foreground = '#292929';
        this.background = 'rgb(245, 160, 78)';
        this.limits = [-20, 20];
        this.maxValue = 200;
        this.radius = this.radius + 50 * this.multiplier;
        this.value = null;
        this.startAngle = Math.PI;
        this.totalAngle = Math.PI;
        this.showLimits = false;
    }

    setRange(range) {
        this.maxValue = range;
        return this;
    }

    setLimits(limits) {
        this.limits = limits;
        return this;
    }

    drawLimits(limits, color) {
        let start = (this.radius + this.thickness / 2 + 20 * this.multiplier);
        let fontSize = 14 * this.multiplier;
        this.context.font = "normal normal normal " + fontSize + "px Roboto";
        this.context.fillStyle = color;
        this.context.textAlign = "center";
        for (let i = 0; i < limits.length; i++) {
            let angle = this.startAngle + Math.PI / 2 + limits[i] * (this.totalAngle / (this.maxValue));
            let x = this.center + start * Math.cos(angle);
            let y = this.center + start * Math.sin(angle) + 6 * this.multiplier;
            this.context.fillText(limits[i], x, y);
        }
        return this;
    }

    drawScale(limits) {
        let radius = this.radius - 30 * this.multiplier;
        let stretch = 20 * this.multiplier;
        let end = (radius + this.thickness + stretch);
        let start = (radius + this.thickness - stretch);
        this.context.strokeStyle = "#FFF";
        this.context.lineCap = "round";
        this.context.lineWidth = 2 * this.multiplier;
        for (let i = 0; i < limits.length; i++) {
            this.context.beginPath();
            let angle = this.startAngle + Math.PI / 2 + limits[i] * (this.totalAngle / (this.maxValue));
            let a1 = this.center + start * Math.cos(angle);
            let b1 = this.center + start * Math.sin(angle);
            let a2 = this.center + end * Math.cos(angle);
            let b2 = this.center + end * Math.sin(angle);
            this.context.moveTo(a1, b1);
            this.context.lineTo(a2, b2);
            this.context.stroke();
            this.context.closePath();
        }
        return this;
    }

    drawNeedle(value, color, startAngle = this.startAngle + Math.PI / 2) {
        this.context.lineWidth = 4 * this.multiplier;
        this.context.fillStyle = color;
        let angle = startAngle + value * (this.totalAngle / (this.maxValue));
        let start = (this.radius + this.thickness - 20 * this.multiplier);
        const dx = 4 * this.multiplier;
        const dy = 100 * this.multiplier;
        const dxy = 10 * this.multiplier;
        const x = this.center + start * Math.cos(angle);
        const y = this.center + start * Math.sin(angle);
        const cx = x - this.multiplier;
        const cy = y + this.multiplier;
        this.context.translate(cx, cy);
        this.context.rotate(angle + Math.PI / 2);
        this.context.translate(-cx, -cy);
        this.context.beginPath();
        this.context.moveTo(x - dxy, y + dy);
        this.context.lineTo(x - dx, y + dxy);
        this.context.quadraticCurveTo(x, y, x + dx, y + dxy);
        this.context.lineTo(x + dxy, y + dy);
        this.context.fill();
        this.context.closePath();
        return this;
    }

    showLabels(labels) {
        let fontSize = 12 * this.multiplier;
        this.context.font = "normal normal Bold " + fontSize + "px Roboto";
        this.context.fillStyle = "#000";
        let align = "right";
        let x = 100 * this.multiplier;
        let y = this.center + 50 * this.multiplier;
        for (let i = 0; i < labels.length; i++) {
            if (i === 1) {
                x = 200 * this.multiplier;
                align = "left";
            }
            this.context.textAlign = align;
            this.wrapText(labels[i], x, y, 100 * this.multiplier, 18 * this.multiplier);
        }
        return this;
    }

    build(value, labels = this.labels, showLimits = this.showLimits, limits = this.limits, foregroundColor = this.foreground, backgroundColor = this.background) {
        super.build();
        this.drawAThreeQuarterCircle(backgroundColor, this.radius, Math.PI + 0.5, this.thickness, Math.PI - 0.25);
        if (this.firstBuild) {
            this.labels = labels;
            this.limits = limits;
            this.background = backgroundColor;
            this.foreground = foregroundColor;
            this.showLimits = showLimits;
            this.value = value;
            this.firstBuild = false;
            this.animationProps = this.value;
            console.log(this);
        }
        this.drawScale(limits);
        if (this.showLimits) this.drawLimits(limits, backgroundColor);
        this.showLabels(labels);
        this.drawNeedle(value, foregroundColor);
        return this;
    }

    wrapText(text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = this.context.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                this.context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        this.context.fillText(line, x, y);
    }


    animate(time = 20) {
        let i = 0;
        let value = 0;
        const animation = () => {
            this.build(value);
            value = ++i * this.animationProps / time;
            if (Math.abs(value) <= Math.abs(this.animationProps)) window.requestAnimationFrame(animation);
            else this.build(this.animationProps);
        };
        animation();
        return this;
    }
}