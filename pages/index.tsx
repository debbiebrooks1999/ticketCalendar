import {CoreGetEventsGetPublicListingEventsRich200Response} from "@vivenu/vivenu-js/types/interfaces/CoreGetEventsGetPublicListingEventsRich200Response"
import type {NextPage} from "next"
import React, {useEffect, useRef, useState} from "react"
import {APIClient} from "../vivenu"
import {Calendar, momentLocalizer, stringOrDate} from "react-big-calendar"
import momentTZ from "moment-timezone"
import {Utils} from "../misc/Utils"
import {useRouter} from "next/router"
import {Media, mediaStyle} from "../components/Media"
import Head from "next/head"

const filterByDayGroup = (date: momentTZ.Moment, group: "morning" | "afternoon" | "evening") => {
  switch (group) {
    case "morning":
      return date.hours() < 12
    case "afternoon":
      return date.hours() >= 12 && date.hours() < 18
    case "evening":
      return date.hours() >= 18
  }
}

const Home: NextPage = () => {
  const router = useRouter()

  const [selectedDate, setSelectedDate] = useState<any>(new Date())

  const [loadedEvent, setEvent] = useState<any>(undefined)

  const [isLoading, setLoading] = useState(true)

  const [items, setItems] = useState<CoreGetEventsGetPublicListingEventsRich200Response>()
  const localeRef = useRef("en")

  const [selectedDay, setSelectedDay] = useState<any>(undefined)

  useEffect(() => {
    if (router.query.eventId) {
      try {
        ;(async () => {
          const event = await APIClient().events.getPublicEvent(router.query.eventId as string, {
            locale: router.query.locale as string | "en",
          })

          localeRef.current = router.query.locale ? (router.query.locale as string) : "en"

          setEvent(event)

          setLoading(false)
        })()
      } catch (e) {
        console.error(e)
      }
    }
  }, [router.query])

  const getCheckoutParameters = (item) => {
    return {
      type: "showCheckoutModal",
      id: item._id,
      shop: router.query.shopId,
      channel: router.query.channelId,
      baseUrl: "https://ticketshop.mesmerica.com"
    }
  }

  const timezone = loadedEvent?.timezone || "America/Chicago"
  momentTZ.tz(timezone)
  momentTZ.locale(localeRef.current)
  const localizer = momentLocalizer(momentTZ)

  const isoWithAppliedTimezone = (date: any) => Utils.getMoment(date, timezone).format("YYYY-MM-DDTHH:mm:ss")

  const transformEvents = () => {
    return items
      ?.map((event: any) => {
        return {
          // pastEvent high low or soldOut
          availability: Utils.getStatus(event),
          isPastEvent: Utils.isPastEvent(event),
          title: Utils.getTitle(event),
          start: isoWithAppliedTimezone(event.start),
          end: isoWithAppliedTimezone(event.end),
        }
      })
  }

  const hasPreviousEvents = (d: Date) => {
    if (
      items?.find(
        (e) =>
          new Date(isoWithAppliedTimezone(e.start)).getDate() == d.getDate() &&
          new Date(isoWithAppliedTimezone(e.start)).getMonth() == d.getMonth() &&
          new Date(isoWithAppliedTimezone(e.start)).getHours() < d.getHours(),
      )
    ) {
      return true
    }
    return false
  }

  const getMonthStart = (start: stringOrDate) => {
    return Utils.getMoment(start, timezone).startOf("month").add(1, "days").toDate()
  }

  const getNextMonthStart = (start: stringOrDate) => {
    return Utils.getMoment(start, timezone).add(7, "day").startOf("month").add(1, "day").toDate()
  }

  const addMonth = (start: stringOrDate) => {
    return Utils.getMoment(start, timezone).add(7, "day").add(1, "month").startOf("month").toDate()
  }

  useEffect(() => {
    setLoading(true)
    try {
      ;(async () => {
        if (loadedEvent && loadedEvent.eventType === "ROOT") {
          let today = Utils.getMoment(new Date(), loadedEvent.timezone)
          let endMin = today.clone().subtract(1, "month").startOf("month").startOf("day").toDate()

            let resp = await APIClient().events.getPublicListingEvents({
              rootId: loadedEvent._id,
              sellerId: router.query.sellerId as string | undefined,
              locale: router.query.locale as string | undefined,
              endMin: endMin.toISOString(),
            })

            resp = resp.filter((publicEvent) => !publicEvent.daySchemeId && publicEvent.saleStatus !== "planned")

            let firstActiveEvent = resp.find((event) => {
              if(new Date(event.start).getTime() <= new Date().getTime()) {
                return false
              }
              if(event.saleStatus == "planned") {
                return false
              }
              if (event.saleStatus == "soldOut") {
                return false
              }
              return true
            });

            if(firstActiveEvent) {
                let day = Utils.getMoment(new Date(firstActiveEvent.start), loadedEvent.timezone)
                setSelectedDate(getMonthStart(day.toDate()))
            }
          
            setItems(resp)
            setLoading(false)
        }
      })()
    } catch (e) {
      console.error(e)
    }
  }, [loadedEvent])

  if (!items) return <p>Loading...</p>

  const onRangeChanged = (range: any) => {
    setSelectedDate(getNextMonthStart(range.start))
    setSelectedDay(undefined)
  }

  const getBorderForEventItem = (item: any): string => {
    const status = Utils.getStatus(item)

    if (new Date(item.end).getTime() < new Date().getTime()) {
      return "#696969 thick solid"
    }

    if (status == "high") {
      return "#48b174 thick solid"
    } else if (status == "low") {
      return "#ea7e22 thick solid"
    } else if (status == "soldOut") {
      return "#e91e26 thick solid"
    }

    return ""
  }

  const renderSelectedDate = () => {
    return <div>{Utils.getMoment(selectedDay, timezone).format("dddd D MMMM")}</div>
  }

  const renderMoney = (item: any) => {
    return new Intl.NumberFormat(localeRef.current as any, {style: "currency", currency: item.currency}).format(
      item.startingPrice,
    )
  }

  const renderDayInfo = () => {
    const itemsForTheDay = items?.filter(
      (item) =>
        selectedDay.getDate() == new Date(isoWithAppliedTimezone(item.start)).getDate() &&
        selectedDay.getMonth() == new Date(isoWithAppliedTimezone(item.start)).getMonth(),
    )
    return (
      <div className={"selectShowing"}>
        <span className={"backArrow"} onClick={() => setSelectedDay(undefined)}>
          {"❮ Back"}
        </span>
        <div className={"header"}>
          <div className={"title"}>SELECT SHOWING</div>
          {renderSelectedDate()}
        </div>
        <div className={"flex-view"}>
          <div className={"box"}>
            <p>Morning</p>
            {itemsForTheDay
              ?.filter((item) => filterByDayGroup(Utils.getMoment(item.start, timezone), "morning"))
              .map((item) => (
                <div
                className={"day-event " + Utils.getStatus(item)}
                  key={item._id}
                  style={{borderBottom: getBorderForEventItem(item)}}
                  onClick={() => {
                    if (Utils.getStatus(item) == "soldOut") {
                      return
                    }

                    window.parent.postMessage(
                      getCheckoutParameters(item),
                      "*",
                    )
                  }}
                >
                  <div>{Utils.getMoment(item.start, timezone).format("h:mm A")}</div>
                  <div>from {renderMoney(item)}</div>
                </div>
              ))}
          </div>
          <div className={"box"}>
            <p>Afternoon</p>
            {itemsForTheDay
              ?.filter((item) => filterByDayGroup(Utils.getMoment(item.start, timezone), "afternoon"))
              .map((item) => (
                <div
                className={"day-event " + Utils.getStatus(item)}
                  key={item._id}
                  style={{borderBottom: getBorderForEventItem(item)}}
                  onClick={() => {
                    if (Utils.getStatus(item) == "soldOut") {
                      return
                    }

                    window.parent.postMessage(
                      getCheckoutParameters(item),
                      "*",
                    )
                  }}
                >
                  <div>{Utils.getMoment(item.start, timezone).format("h:mm A")}</div>
                  <div>from {renderMoney(item)}</div>
                </div>
              ))}
          </div>
          <div className={"box"}>
            <p>Evening</p>
            {itemsForTheDay
              ?.filter((item) => filterByDayGroup(Utils.getMoment(item.start, timezone), "evening"))
              .map((item) => (
                <div
                  className={"day-event " + Utils.getStatus(item)}
                  key={item._id}
                  style={{borderBottom: getBorderForEventItem(item)}}
                  onClick={() => {
                    if (Utils.getStatus(item) == "soldOut") {
                      return
                    }

                    window.parent.postMessage(
                      getCheckoutParameters(item),
                      "*",
                    )
                  }}
                >
                  <div>{Utils.getMoment(item.start, timezone).format("h:mm A")}</div>
                  <div>from {renderMoney(item)}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    )
  }

  const renderAvailabilityIndicators = () => {
    return (
      <div className={"availabilities"}>
        <div className={"good"}>
          <div className={"statusDot high"}>•</div>
          Available
        </div>
        <div className={"low"}>
          <div className={"statusDot low"}>•</div>
          Last few left
        </div>
        <div className={"out"}>
          <div className={"statusDot soldOut"}>•</div>
          Sold out
        </div>
      </div>
    )
  }

  const renderMobilePastIndicators = () => {
    console.log("removing the highlights from past events")
  }


  const CustomToolBar = (toolbar) => {
    let currentDate = toolbar.date
    const month = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]
  
    let currentMonth = currentDate.getMonth()
    let previous = month[(currentMonth - 1) % 12]
    if (currentMonth - 1 < 0) {
      previous = month[12 - (Math.abs(currentMonth - 1) % 12)]
    }
    let next = month[(currentMonth + 1) % 12]
  
    let showNext = true
    
    const nextMonth = addMonth(currentDate)
    const itemInNextMonth = items.find((item) => {
      return new Date(item.start) >= new Date(nextMonth.toISOString())
    })

    if (!itemInNextMonth) {
      showNext = false
    }

    const goBack = () => {
      const newDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1);
      toolbar.onNavigate('prev', newDate)
    }

    const goNext = () => {
      const newDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1);
      toolbar.onNavigate('next', newDate)
    }

    return (
      <div className={"rbc-toolbar"}>
          <span className="rbc-btn-group">
            <button type="button" onClick={goBack}>
            <div className={"prevMonth"}>
              {/* @ts-ignore */}
              <Media at="sm">
                <span className={"leftArrow"}>&#9664;</span>
              </Media>
              {/* @ts-ignore */}
              <Media greaterThanOrEqual="md">
                <span className={"leftArrow"}>&#9664;</span>
                {previous}
              </Media>
            </div>
            </button>
            {showNext && (
              <button type="button" onClick={goNext}>
                <div className={"nextMonth"}>
                  {/* @ts-ignore */}
                  <Media at="sm">
                    <span className={"rightArrow"}>&#9654;</span>
                  </Media>
                  {/* @ts-ignore */}
                  <Media greaterThanOrEqual="md">
                    {next}
                    <span className={"rightArrow"}>&#9654;</span>
                  </Media>
                </div>
              </button>
            )}
          </span>
          <span className='rbc-toolbar-label'>
            {month[currentMonth]} {currentDate.getFullYear()}
          </span>
            

      </div>
    )
  }

  const renderMonthlyCalendar = () => {
    return (
      <div className={"event-calendar"}>
        {!selectedDay && (
          <Calendar
            popup={true}
            drilldownView={null}
            events={transformEvents()}
            date={selectedDate}
            defaultView={"month"}
            views={{month: true}}
            localizer={localizer}
            style={{height: "90vh", width: "100vw"}}
            components={{
              event: (ev) => {
                let itemsForDay = transformEvents()?.filter(
                  (e) =>
                    new Date(e.start).getDate() == new Date(ev.event.start).getDate() && new Date(e.start).getMonth() == new Date(ev.event.start).getMonth(),
                )
                let title = ev.event.title;
                let isPastEvent = ev.event.isPastEvent;
                let availibilty = ev.event.availability;

              

                if (itemsForDay?.length) {
                  if (itemsForDay?.find((item) => item.availability == "high")) {
                    title = "Available"
                  } else if (itemsForDay?.find((item) => item.availability == "low")) {
                    title = "Low Avail"
                  } else if (itemsForDay?.find((item) => item.availability == "soldOut")) {
                    title = "Sold Out"
                  }
  
                  const aboveThreshCounter = itemsForDay.reduce((acc: any, item: any) => {
                    if (item.availability == "low") {
                      return acc + 1
                    }
                    return acc
                  }, 0)
  
                  if (aboveThreshCounter > itemsForDay.length / 2) {
                    title = "Low Avail"
                  }

                  if(isPastEvent){
                    availibilty = "soldOut"
                    title = "Sold Out"
                  }

                  
                }
                
                return (

                <div className={"day-with-event " + availibilty + (ev.event.isPastEvent ? " pastEvent" : "")}>
                  <p className={"title"}>{title}</p>
                </div>
                )
              },
              toolbar: CustomToolBar
            }}
            eventPropGetter={(event) => {
              let style = {} as any

              if (hasPreviousEvents(new Date(event.start))) {
                style.display = "none"
              }
              return {
                style: style,
              }
            }}
            dayPropGetter={(event) => {
              let itemsForDay = transformEvents()?.filter(
                (e) =>
                  new Date(e.start).getDate() == event.getDate() && new Date(e.start).getMonth() == event.getMonth(),
              )
              let availability = ""
              let style = {
                background: "#1b1b1b",
              } as any
              if (itemsForDay?.length) {

                if (itemsForDay?.find((item) => item.availability == "high")) {

                  style.borderBottom = "#48b174 thick solid"

                } else if (itemsForDay?.find((item) => item.availability == "low")) {

                  style.borderBottom = "#ea7e22 thick solid"

                } else if (itemsForDay?.find((item) => item.availability == "soldOut")) {

                  style.borderBottom = "#e91e26 thick solid"
                }
              

                const aboveThreshCounter = itemsForDay.reduce((acc: any, item: any) => {
                  if (item.availability == "low") {
                    return acc + 1
                  }
                  return acc
                }, 0)

                if (aboveThreshCounter > itemsForDay.length / 2) {
                  style.borderBottom = "#ea7e22 thick solid"
                }
                if (itemsForDay?.find((item) => item.isPastEvent)) {
                  style.opacity = "0.4";
                  style.borderBottom = "#e91e26 thick solid"
                }

                style.background = "#444444"
                style.color = "#FFFFFF"
              }

              return {
                style: style,
              }
            }}
            onSelectEvent={(SlotInfo) => {
              if (SlotInfo.isPastEvent) {
                return
              }
              setSelectedDay(new Date(SlotInfo.start))
            }}
            onRangeChange={(range) => onRangeChanged(range)}
          />
        )}
        {selectedDay && renderDayInfo()}
        {renderAvailabilityIndicators()}
        {renderMobilePastIndicators()}
      </div>
    )
  }
  // break to mobile if <= 1024px
  const renderMobileCalendar = () => {
   
    return (
      <div className={"mobile-event-calendar"}>
        {!selectedDay && (
          <Calendar
            popup={true}
            drilldownView={null}
            events={transformEvents()}
            date={selectedDate}
            defaultView={"month"}
            views={{month: true}}
            localizer={localizer}
            style={{width: "100vw"}}
            components={{
              event: (event) => {

                let itemsForDay = transformEvents()?.filter(
                  (e) =>
                    new Date(e.start).getDate() == new Date(event.event.start).getDate() &&
                    new Date(e.start).getMonth() == new Date(event.event.start).getMonth(),
                )
                let availability = ""
                // let totalShows = "zero"

                if (itemsForDay?.length) {

                    // totalShows = itemsForDay.length
                    availability = "soldOut"

                  if (itemsForDay?.find((item) => item.availability == "high")) {
                    availability = "high"
                  } else if (itemsForDay?.find((item) => item.availability == "low")) {
                    availability = "low"
                  } else if (itemsForDay?.find((item) => item.availability == "soldOut")) {
                    // make red if and only if sold out
                    availability = "soldOut"
                   }

                  const aboveThreshCounter = itemsForDay.reduce((acc: any, item: any) => {
                    if (item.availability == "low") {
                      return acc + 1
                    }
                    return acc
                  }, 0)

                  if (aboveThreshCounter > itemsForDay.length / 2) {
                    availability = "low"
                  }

                  if (itemsForDay?.find((item) => item.isPastEvent)) {
                    availability += " pastEvent"
                  }

                  // if (itemsForDay.length == 1){
                  //   totalShows = "oneShow"
                  // }
                  // if (itemsForDay.length == 2){
                  //   totalShows = "twoShow"
                  // }
                  // if (itemsForDay.length == 3){
                  //   totalShows = "threeShow"
                  // }

                }
                //highlight
                return (
                  <div className={"day-with-event"}>
                    <div className={"statusDot " + availability}>•</div>
                  </div>
                )
              },
              toolbar: CustomToolBar
            }}
            eventPropGetter={(event) => {
              let style = {} as any

              if (hasPreviousEvents(new Date(event.start))) {
                style.display = "border:3px solid red;"
                // style.display = "none"
              }
              return {
                style: style,
              }
            }}
            onSelectEvent={(SlotInfo) => {
              if (SlotInfo.isPastEvent) {
                return
              }
              setSelectedDay(new Date(SlotInfo.start))
            }}
            onRangeChange={(range) => onRangeChanged(range)}
          />
        )}
        {selectedDay && renderDayInfo()}
        {renderAvailabilityIndicators()}
      </div>
    )
  }

  return (
    <>
      <Head>
        <style type="text/css">${mediaStyle}</style>
      </Head>
      {/* @ts-ignore */}
      <Media greaterThanOrEqual="lg">{renderMonthlyCalendar()}</Media>
      {/* @ts-ignore */}
      <Media at="md">{renderMobileCalendar()}</Media>
      {/* @ts-ignore */}
      <Media at="sm">{renderMobileCalendar()}</Media>
    </>
  )
}

export default Home
