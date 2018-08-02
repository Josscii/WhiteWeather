$ui.render({    
    props: {
        navBarHidden: true,
        statusBarHidden: true
    },
    views: [
        {
            type: "view",
            props: {
                id: "root-view",
                bgcolor: bgcolor()
            },
            layout: $layout.fill,
            views:[
                {
                    type: "label",
                    props: {
                        id: "l36",
                        font: $font("bold", 36),
                        textColor: textColor()
                    },
                    layout: function(make, view) {
                        var offset = 50
                        if ($device.isIphoneX) {
                            offset += 40
                        }
                        make.top.equalTo(view.super).offset(offset)
                        make.left.equalTo(view.super).offset(35)
                    }
                },
                {
                    type: "label",
                    props: {
                        id: "l32",
                        font: $font("bold", 32),
                        textColor: textColor(),
                        lines: 0
                    },
                    layout: function(make, view) {
                        make.top.equalTo(view.prev.bottom).offset(10)
                        make.left.equalTo(view.prev)
                        make.right.equalTo(view.super).inset(60)
                    }
                },
                {
                    type: "label",
                    props: {
                        id: "l28",
                        font: $font("bold", 28),
                        textColor: textColor()
                    },
                    layout: function(make, view) {
                        make.top.equalTo(view.prev.bottom).offset(10)
                        make.left.equalTo(view.prev)
                    }
                },
                {
                    type: "label",
                    props: {
                        id: "l24",
                        font: $font("bold", 24),
                        textColor: textColor()
                    },
                    layout: function(make, view) {
                        make.top.equalTo(view.prev.bottom).offset(10)
                        make.left.equalTo(view.prev)
                    }
                },
                {
                    type: "label",
                    props: {
                        id: "l20",
                        font: $font("bold", 20),
                        textColor: textColor()
                    },
                    layout: function(make, view) {
                        make.bottom.equalTo(view.super).inset(50)
                        make.right.equalTo(view.super).inset(35)
                    }
                },
                {
                    type: "label",
                    props: {
                        id: "statusLabel",
                        text: "白话天气.",
                        font: $font("bold", 24),
                        bgcolor: bgcolor(),
                        align: $align.center,
                        textColor: textColor(),
                        lines: 0,
                        hidden: true
                    },
                    layout: $layout.fill
                }
            ],
            events: {
                ready: function(sender) {
                    getWeather()
                }
            }
        }
    ]
})

function getWeather() {
    var cachedData = getCache()

    if (cachedData != undefined) {
        updateUI(cachedData)
    } else {
        startLoading()
        $delay(1, function() {
            getApi(api => {
                $location.fetch({
                    handler: function(resp) {
                        var lng = resp.lng
                        var lat = resp.lat
                        var time = parseInt(new Date().getTime() / 1000)
                        var url = api.replace("$0", lng).replace("$1", lat).replace("$2", time)
                        $http.get({
                            url: url,
                            handler: function(resp) {
                                var data = resp.data
                                if (data["status"] == "ok") {
                                    cache(data)
                                    updateUI(data)
                                    stopLoading()
                                } else {
                                    loadingFailed()
                                }
                            }
                        })
                    }
                })
            }, () => {
                loadingCanceled()
            })
        })
    }
}

const LEANCLOUD_APP_ID = "ysUuE04Lk4BW3BHFKx1D0J8m-gzGzoHsz"
const LEANCLOUD_APP_KEY = "V2ndP6GxVkAiB6MuEYbkht0U"

function getApi(succsed, failed) {
    var now = new Date()
    var lastGetApiDate = $cache.get("lastGetApiDate")
    var lastApi = $cache.get("lastApi")

    if (lastApi == undefined || (lastApi != undefined && lastGetApiDate != undefined && !sameDay(now, lastGetApiDate))) {
        $http.get({
            url: "https://ysuue04l.api.lncld.net/1.1/classes/WhiteWeather",
            timeout: 10,
            header: {
                "X-LC-Id": LEANCLOUD_APP_ID,
                "X-LC-Key": LEANCLOUD_APP_KEY
            },
            handler: function(resp) {
                var response = resp.response
    
                if (response.statusCode == 200) {
                    var data = resp.data
                    var result = data.results.pop()
                    var api = result.api
                    var version = result.version
                    var updateInfo = result.updateInfo

                    if (version.localeCompare(currentVersion) == 1) {
                        $ui.alert({
                            title: `新版 ${version} 来啦！`,
                            message: updateInfo,
                            actions: [
                                {
                                    title: "取消",
                                    handler: function() {
                                    }
                                },
                                {
                                    title: "更新",
                                    handler: function() {
                                        replaceAddin()
                                    }
                                }
                            ]
                        })
                    }

                    if (api.length > 0) {
                        $cache.set("lastGetApiDate", now)
                        $cache.set("lastApi", api)
                        succsed(api)
                        return
                    }
                }
    
                failed()
            }
        })
    } else {
        succsed(lastApi)
    }
}

function updateUI(data) {
    var weather = data["result"]["hourly"]["description"]
    var first = weather.split("，", 1)[0]
    var second = ""
    if (first.length > 0 && weather.includes("，")) {
        second = weather.replace(first + "，", "")
    }

    first = first.trim()
    second = second.trim()

    if (first.length > 0) {
        if (second.length == 0) {
            first += "。"
        } else {
            first += "，"
        }
    }

    setFirstWeatherDesc(first)
    setSecondWeatherDesc(second)

    var temp = data["result"]["realtime"]["temperature"]
    setTemp(temp)

    var aqi = data["result"]["realtime"]["aqi"]
    setAQI(aqi)

    setTime()
}

function setFirstWeatherDesc(desc) {
    if (desc == undefined) {
        desc = ""
    }

    $("l36").text = desc

    if (desc == "") {
        $("l32").updateLayout(function(make) {
            make.top.equalTo($("l36").bottom)
        })
    }
}

function setSecondWeatherDesc(desc) {
    if (desc == undefined) {
        desc = ""
    }

    if (desc.length > 0) {
        desc += "。"
    }

    $("l32").text = desc

    if (desc == "") {
        $("l28").updateLayout(function(make) {
            make.top.equalTo($("l32").bottom)
        })
        $("l36").font = $font("bold", 32)
    }
}

function setTemp(temp) {
    var t = Math.round(temp)
    var tempstr = `${t}`
    var tempdesc = `当前温度 ${tempstr}°，`
    var attributeText = $objc("NSMutableAttributedString").$alloc().$initWithString(tempdesc)
    var range = $range(5, tempstr.length+1)
    attributeText.$addAttribute_value_range("NSColor", $color("#D0021B"), range)
    $("l28").runtimeValue().$setAttributedText(attributeText)
}

function setAQI(aqi) {
    var aqiStr = ""
    var aqiColor = $color("#7ED321")
    if (aqi <= 50) {
        aqiStr = "优"
        aqiColor = $color("#7ED321")
    } else if (aqi > 50 && aqi <= 100) {
        aqiStr = "一般"
        aqiColor = $color("#417505")
    } else {
        aqiStr = "差"
        aqiColor = $color("#8B572A")
    }
    var aqiDesc = `空气质量${aqiStr}。`
    var attributeText = $objc("NSMutableAttributedString").$alloc().$initWithString(aqiDesc)
    var range = $range(4, aqiStr.length)
    attributeText.$addAttribute_value_range("NSColor", aqiColor, range)
    $("l24").runtimeValue().$setAttributedText(attributeText)
}

function setTime() {
    function pad(s) { return (s < 10) ? '0' + s : s; }
    var d = new Date()
    var dateStr = [d.getFullYear(), pad(d.getMonth()+1), pad(d.getDate())].join('/')
    $("l20").text = "- " + dateStr
}

function startLoading() {
    $("statusLabel").hidden = false

    var text = ["白话天气.", "白话天气..", "白话天气..."]
    var flag = 0

    loadingTimer = $timer.schedule({
        interval: 0.5,
        handler: function() {
            $("statusLabel").text = text[flag]
            flag += 1
            flag %= 3
        }
    })
}

function stopLoading() {
    loadingTimer.invalidate()
    $("statusLabel").hidden = true
}

function loadingFailed() {
    loadingTimer.invalidate()
    $("statusLabel").text = "请求失败"
}

function loadingCanceled() {
    loadingTimer.invalidate()
    $("statusLabel").text = "暂停服务\n后会有期"
}

function getCache() {
    var data = $cache.get("weather-data")
    if (data != undefined) {
        var now = parseInt(new Date().getTime() / 1000)
        var cacheDate = data["server_time"]
        if (now - cacheDate < 600) {
            return data
        }
    }
}

function cache(data) {
    $cache.set("weather-data", data)
}

function textColor() {
    var now = new Date().getHours()
    if (now > 18 || now < 7) {
        return $color("white")
    } else {
        return $color("#333333")
    }
}

function bgcolor() {
    var now = new Date().getHours()
    if (now > 18 || now < 7) {
        return $color("black")
    } else {
        return $color("white")
    }
}

var currentVersion = "1.0.0"

function replaceAddin() {
    var link = "https://raw.githubusercontent.com/Josscii/WhiteWeather/master/whiteweather.js"
    var url = `jsbox://install?url=${encodeURIComponent(link)}&name=${encodeURIComponent("白话天气")}&types=${encodeURIComponent(3)}`
    $app.openURL(url)
    $app.close()
}

function sameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
}