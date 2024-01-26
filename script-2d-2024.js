
function calculate_percentage_by_lender(lender, a, b){
    var appretiation = 0
    var share = 0
    switch(lender){
        case 'unison' : 
            var c = a / b
            appretiation = (c <= 0.05) ? 0.2 : (c <= 0.1) ? 0.4 : (c <= 0.15) ? 0.6 : (c <= 0.175) ? 0.7 : 999
            break;
        case 'unlock' : 
            var c = a / b
            share = (c <= 0.05) ? 0.08 : (c <= 0.1) ? 0.16 : (c <= 0.2) ? 0.32 : (c <= 0.4375) ? 0.7 : 0
            break;
        case 'point' : 
            appretiation = 0.3
            break;
        case 'hometap' : 
            share = 0.16
            break;
        case 'splitero' : 
            appretiation = 0.38
            break;
        default :
            break;
    }

    return { appretiation, share }
}
function main(){
    return {
        investmentNeeded : "",
        homeValue : 0,
        state : "",
        yearlyAppreciation : 0,
        paybackDate: "",
        houseValue: 0,
        percentageVariant: "",
        lenders: [],
        states: [],
        total: 0,
        percentageVariantClass : "",
        lender : {},
        init() {
    this.lenders = $(".lender").map(function(){
        var lender = $(this).data()
        lender.states = lender.states.replace(/\n/g,"").replace(/ /g,"").split(",")
        $(this).closest("[data-lenders]").attr("data-lender", lender.slug)
        return lender
    })

    $("[data-model]").each((_, input) => {
        var model = $(input).data("model")
        var val = $(input).attr("type") === "text" ? $(input).attr("placeholder").replace("$", "").replace("% / year", "") : $(input).val()
        $(input).attr("x-model", model).attr("x-on:keyup", "calculate()").attr("x-on:change", "calculate()")

        if(model !== "paybackDate")
            this[model] = val
        else if(model === "paybackDate" && $(input).data("checked") === "checked")
            this[model] = val
    })

            $(".selection_years_wrapper label").removeClass("selected")
            this.calculate()

    $("[data-lender]").click((item) => {
        var slug = $(item.currentTarget).data("lender")
        var l = this.lenders.filter((i, l) => {
            return l.slug === slug
        })
        this.lender = l[0]
    })

    this.states = $(".data-states [data-states]").map((i, state) => {
        var s = $(state).data()
        return s
    })
    this.states = this.states.sort(function(a, b){
        if ( a.name < b.name )
            return -1
        if ( a.name > b.name )
            return 1
        return 0
    })
    $("#State").html("")
    this.states.each((i, s) => {
        $("#State").append(`<option value="${s.name}">${s.name}</option>`)
    })

    $("[data-clear]").focus((input) => {
        var $input = $(input.currentTarget)
        $input.select();
    })
        },
        getLender(i){
            return this.lenders[i]
        },
        money(val){
            var formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
          });

            return formatter.format(val);
        },
        setYearPlaceholder() {
            var paddingLeft = (24 + (this.yearlyAppreciation.length * 8.3)) + "px"
            document.body.style.setProperty(
                '--padding-left', 
                paddingLeft
            );
        },
        calculate() {
            var paddingLeft = (16 + (this.yearlyAppreciation.length * 8.3)) + "px"
            document.body.style.setProperty(
                '--padding-left', 
                paddingLeft
            );

            var hv = parseFloat(this.homeValue.replace(/,/g, ""))
            var invn = parseFloat(this.investmentNeeded.replace(/,/g, ""))
            var ya = parseFloat(this.yearlyAppreciation) / 100
                
            var years = parseInt(this.paybackDate.replace("Year ", ""))
            if(!isNaN(hv) && !isNaN(invn) && !isNaN(ya) && !isNaN(years)){
                this.total = (hv+(invn*1.25))*Math.pow(1+ya, years)
                this.houseValue = this.money(this.total)
                var percentageVariant = ((this.total - hv) / hv) * 100
                this.percentageVariant = percentageVariant > 0 ? percentageVariant.toFixed(0) + "% increase" :  percentageVariant < 0 ? percentageVariant.toFixed(0) + "% decrease" : ""
                this.percentageVariantClass = percentageVariant > 0 ? "increase" :  percentageVariant < 0 ? "decrease" : "zero"
                this.calculateLenders(hv, invn, years)
            }else{
                this.houseValue = this.money(0)
                this.percentageVariantClass = "zero"
                this.lenders.map((i, lender) => {
                    lender.share = 0
                    lender.investorShare = this.money(0)
                    $("[data-lender='"+lender.slug+"']").find("[data-lender-share]").text(this.money(lender.share))
                    $("[data-lender='"+lender.slug+"']").find("[data-lender-investor]").text(lender.investorShare)
                })
            }
        },
        format(type){
            if(type === 'paybackDate')
                return this.paybackDate.replace("Year ", "")
        },
        calculateLenders(hv, invn, years){
            this.lenders.map((i, lender) => {
                var increase_home_value = invn * 1.25 //Increase home value from of ADU
                var not_increase_home_value = lender.notAdu ? increase_home_value : 0
                var house_apretiation = this.total-(hv+increase_home_value)*(lender.calculateAppreciation/100) - not_increase_home_value //$ in house appreciation (as calculated by lender)   
                var percentage_appretiation_by_lender = calculate_percentage_by_lender(lender.slug, invn, hv).appretiation //% in house appreciation to be paid to lender
                var percentage_share_by_lender = calculate_percentage_by_lender(lender.slug, invn, hv).share //% share in the house to be paid to lender
                var paid_to_lender = house_apretiation*percentage_appretiation_by_lender+this.total*percentage_share_by_lender //$ to be paid to lender
                var fees = !isNaN(parseFloat(lender.fees)) ? parseFloat(lender.fees) : 0 //Other Origination fees
                var min = invn*(lender.min/100)+fees //Origination fee - Min
                var investor_share = paid_to_lender+min+(lender.notPayback ? 0 : invn)//Total repayment by homeowner to lender at time of sale (Investor Share)
                var payout_to_homeowner = this.total - investor_share //Payout to homeowner at time of sale
                lender.share = payout_to_homeowner
                lender.investorShare = investor_share >= 0 ? this.money(investor_share) : this.money(0)

                // if(lender.slug === "splitero"){
                //     console.log("Increase home value from of ADU: ", increase_home_value)   
                //     console.log("not_increase_home_value: ", not_increase_home_value)   
                //     console.log("$ in house appreciation (as calculated by lender) : ", house_apretiation)   
                //     console.log("% in house appreciation to be paid to lender : ", percentage_appretiation_by_lender)   
                //     console.log("% share in the house to be paid to lender : ", percentage_share_by_lender)   

                //     console.log("$ to be paid to lender: ", paid_to_lender)   
                //     console.log("Other Origination fees: ", fees)   
                //     console.log("Origination fee - Min: ", min)   
                //     console.log("Total repayment by homeowner to lender at time of sale (Investor Share) : ", investor_share)   
                //     console.log("Payout to homeowner at time of sale : ", payout_to_homeowner)   
                // }


                $("[data-lender='"+lender.slug+"']").find("[data-lender-share]").text(this.money(lender.share))
                $("[data-lender='"+lender.slug+"']").find("[data-lender-investor]").text(lender.investorShare)

                return lender
            })

            this.lenders.sort((a, b) => {
                if ( a.share < b.share )
                  return 1
                if ( a.share > b.share )
                  return -1
                return 0
            })

            this.lender = this.lenders[0]

            for(var i = 0; i < this.lenders.length; i++){
                var show = (this.lenders[i].states.includes(this.state.replace(/ /g, "")) && years <= parseInt(this.lenders[i].years)) ? "block" : "none"
                $("[data-lender='"+this.lenders[i].slug+"']").css({"order": i, "display" : show})
            }
        }
    }
}

  
  
