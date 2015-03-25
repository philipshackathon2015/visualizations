var VisualizationController = function(){
  this.dates = {startDate: new Date("2014-08-01"), endDate: new Date("2015-03-10")};
  this.unitData = {};
  this.unitDataByDate = {};
  this.renderGraph();
  this.getAndRenderData();
  this.dateListeners();
  this.selectionListener();
  this.selected = "sleep";
  this.width = 700;
  this.height = 400;
  this.padding = 100;
};


VisualizationController.prototype = {
  boundDataByDate: function(){
    var self = this;
    for (var key in self.unitData){
      self.unitDataByDate[key] = self.unitData[key].map(function(dataPoint){
        if (self.dates.startDate <= dataPoint.timestamp && self.dates.endDate >= dataPoint.timestamp){
          return dataPoint;
        }
      });
      self.unitDataByDate[key] = self.unitDataByDate[key].filter(function(n){ return n != undefined; });
    }
    this.renderData(self.unitDataByDate[this.selected]);
  },
  dateListeners: function(){
    var self = this;
    document.getElementById("start-date").addEventListener('change', function(e){
      self.dates.startDate = new Date(this.value);
      self.boundDataByDate();
    });
    document.getElementById("end-date").addEventListener('change', function(e){
      self.dates.endDate = new Date(this.value);
      self.boundDataByDate();
    });
  },
  getData: function(unit, unitName, def){
    var self = this;
    $.ajax( { url: "https://api.mongolab.com/api/1/databases/healthsweet/collections/filtered_observations?q={'unit': '" + unit + "'}&apiKey=50f3be0fe4b09b3cd11ebcd1",
      type: "GET",
      contentType: "application/json" } )
    .done(function(d){
      d.forEach(function(el){
        el.timestamp = new Date(el.timestamp.$date);
      });
      self.unitData[unitName] = d;
      def.resolve();
    });
  },
  getDate: function(){
    var currentDate = $( ".datepicker" ).datepicker( "getDate" );
  },
  getAndRenderData: function(){
    var d1 = new $.Deferred();
    var d2 = new $.Deferred();
    var d3 = new $.Deferred();
    var d4 = new $.Deferred();
    var self = this;
    this.getData("MDC_HF_ACT_SLEEP", "sleep", d1);
    this.getData("MDC_HF_DISTANCE", "steps", d2);
    this.getData("MDC_PHYSIO_MOOD", "mood", d3);
    this.getSentimentData("social", d4);
    $.when(d1, d2, d3, d4).then(function(){
      document.getElementById('loading').classList.add('hide');
      self.boundDataByDate();
    }); 
  },
  getSentimentData: function(unitName, def){
    var self = this;
    $.ajax( { url: "https://api.mongolab.com/api/1/databases/healthsweet/collections/sentiment?q={}&apiKey=50f3be0fe4b09b3cd11ebcd1",
      type: "GET",
      contentType: "application/json" } )
    .done(function(d){
      d.forEach(function(el){
        el.timestamp = new Date(el.created_at);
        el.value = el.sentiment.aggregate.score;
        el.sentValue = el.sentiment.sentiment;
      });
      self.unitData[unitName] = d;
      def.resolve();
    });
  },
  plotLine: function(){

  },
  plotPoints: function(posArray){
    d3.selectAll(".point").remove();

    var circles = this.graph.selectAll("circle");

    var colorScale = d3.scale.linear()
      .domain([d3.min(posArray[1]), d3.max(posArray[1])]) 
      .range([-200, 200]); 

    var coordArr = [];
    for(var i = 0; i<posArray[0].length; i++){
      coordArr[i] = [posArray[0][i], posArray[1][i]];
    }

    var self = this;

    circles.data(coordArr)
      .enter()
      .append("circle")
      .attr("fill", function(d){
          if (colorScale(d[1])>0){
            return "rgba(" + (Math.floor(colorScale(d[1]))) + ",0,50,0.7)";
          } else {
            return "rgba(0," + (-1 * Math.floor(colorScale(d[1]))) + ",50,0.7)";
          }
      })
      .attr("class", "point")
      .attr("cx", function(d, i){
        return d[0];
      })
      .attr("cy", function(d){
        return d[1];
      })
      .attr("r", function() {
        return 10 + "px";
      });

  },
  renderData: function(data){
    var dateData = this.setDataDateRange(data);
    var valueData = this.setDataValueRange(data);
    this.plotPoints([dateData, valueData]);
  },
  renderGraph: function(){
    this.graph = d3.select("body")
                    .append("svg:svg")
                    .attr("class", "svg-total")
                    .attr("width", this.width)
                    .attr("height", this.height);
  },
  renderDataValueRange: function(minvalue, maxvalue){
    var yScale = d3.scale.linear()
      .domain([minvalue, maxvalue]) 
      .range([this.height - this.padding, this.padding]); 


    var yAxis = d3.svg.axis()
            .orient("left")
            .scale(yScale);

    d3.select("#yaxis").remove();


    this.graph.append("g")
      .attr("id", "yaxis")
      .attr("transform", "translate("+this.padding+",0)")
      .call(yAxis);
    return yScale;
  },
  renderDataDateRange: function(mindate, maxdate){
    var xScale = d3.time.scale()
      .domain([mindate, maxdate])  
      .range([this.padding, this.width - this.padding * 2]);


    var xAxis = d3.svg.axis()
            .orient("bottom")
            .scale(xScale);

    d3.select("#xaxis").remove();

    this.graph.append("g")
        .attr("class", "xaxis") 
        .attr("id", "xaxis")
        .attr("transform", "translate(0," + (this.height - this.padding) + ")")
        .call(xAxis);

    this.rotateXLabels();
    return xScale; 
  },
  rotateXLabels: function(){
    this.graph.selectAll(".xaxis text") 
      .attr("transform", function(d) {
          return "translate(" + this.getBBox().height*-2 + "," + this.getBBox().height + ")rotate(-45)";
        });
  },
  setDataDateRange: function(data){
    var daterange = [];
    for (var i=0; i<data.length; i++){
      daterange.push(data[i].timestamp);
    }

    var maxdate = new Date(Math.max.apply(Math, daterange));
    var mindate = new Date(Math.min.apply(Math, daterange));
    var xScale = this.renderDataDateRange(mindate, maxdate);
    var mappedRange = daterange.map(function(item){
      return xScale(item);
    });
    return mappedRange;
  },
  setDataValueRange: function(data){
    var range = [];
    for (var i=0; i<data.length; i++){
      range.push(data[i].value);
    }
    var maxvalue = Math.max.apply(Math, range);
    var minvalue = Math.min.apply(Math, range);
    var yScale = this.renderDataValueRange(minvalue, maxvalue);
    var mappedRange = range.map(function(item){
      return yScale(item);
    });

    return mappedRange;
  },
  selectionListener: function(){
    var self = this;
    document.getElementById("type-menu").addEventListener('change', function(){
      self.selected = this.options[this.selectedIndex].value;
      self.renderData(self.unitDataByDate[self.selected]);
    });
  }
};

var visualizationController = new VisualizationController();