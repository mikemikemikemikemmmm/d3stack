import React, { Component } from 'react'
import * as d3 from 'd3'
import { industryNameList, typeNameList } from './config/tableName'
import { element } from 'prop-types'
import { type } from 'os'
interface IType {
    name: string, color: string
}
interface IState {
    typeObjList: IType[],
    industryShowList: string[],
    informationShow: string,
    sortedBy: string,
    isAlertShow: boolean,
    alertText: JSX.Element
}
interface strKeyObj {
    [key: string]: any
}
export default class APP2 extends Component<any, IState> {
    //top,bottom,left,right
    margin: { t: number, b: number, l: number, r: number }
    height: number
    width: number
    originalData: any
    rectWidth: number
    rectIntervalWidth: number
    svgGSelect!: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    yAxisGSelect!: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    xAxisGSelect!: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    rectContainerGSelect!: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    yScale!: d3.ScaleLinear<number, number>
    xScale!: d3.ScaleBand<string>
    constructor(props: any) {
        super(props)
        this.rectWidth = 20
        this.rectIntervalWidth = 10
        this.margin = {
            //top,bottom,left,right
            t: 50,
            b: 150,
            l: 100,
            r: 50
        }
        this.height = 500
        this.width = 500
        this.originalData = [] //cleaned data
        this.state = {
            typeObjList: [
                { name: '每人每月經常性薪資(新臺幣元)', color: '' },
                { name: '每人每月非經常性薪資(新臺幣元)', color: '' }],// the string is the value of typeName
            industryShowList: ['0'],
            informationShow: 'salary',
            sortedBy: '',
            isAlertShow: false,
            alertText: <span></span>
        }
    }
    initDraw = (): void => {
        this.svgGSelect = d3
            .select('#svgSection')
            .attr('width', this.width + this.margin.l + this.margin.r)
            .attr('height', this.height + this.margin.t + this.margin.b)
            .append("g")
            .attr("transform", `translate(${this.margin.l}, ${this.margin.t})`);
        this.xAxisGSelect = this.svgGSelect.append("g")
            .attr("class", "x_container")
            .attr("transform", `translate(0,${this.height})`)
        this.yAxisGSelect = this.svgGSelect.append("g")
            .attr("class", "y_container")
        this.rectContainerGSelect = this.svgGSelect.append('g')
            .attr("class", "rect_container")
        this.setColor()
    }
    handleMouseOut = () => {
        this.setState({ ...this.state, isAlertShow: false })
    }
    handleMouseOver = (d: any, i: number) => {
        const self = this
        const setText = () => {
            return (<ul style={{
                listStyle: 'none',
                margin: 0,
                padding: 10
            }}>
                <li>{d.data['產業']}</li>
                {
                    self.state.typeObjList.map((typeObj) =>
                        <li key={typeObj.name}>{typeObj.name}:{d.data[typeObj.name]}</li>
                    )
                }
            </ul>)
        }
        this.setState({ ...this.state, alertText: setText(), isAlertShow: true })
    }
    draw = (stackedData: d3.Series<{ [key: string]: number; }, string>[], yAxisMax: number): void => {
        const self: this = this
        const dataLength: number = self.state.industryShowList.length
        const drawXAxis = (): void => {
            const mapIndexToIndustry: string[] = stackedData[0].map((el: any) => el['data']['產業'])
            self.xScale = d3.scaleBand().domain(mapIndexToIndustry).range([0, self.width])
            const xAxis = d3.axisBottom(self.xScale)
            self.xAxisGSelect
                .transition()
                .call(xAxis)
            self.xAxisGSelect.selectAll('text')
                .style("text-anchor", "end")
                .style("font-size", "12px")
                .style("font-weight", "900")
                .attr("transform", () => "rotate(-25)");
        }
        const drawYAxis = (): void => {
            self.yScale = d3.scaleLinear().domain([0, yAxisMax]).range([this.height, 0])
            const yAxis = d3.axisLeft(self.yScale)
            self.yAxisGSelect.transition().call(yAxis);
        }
        const drawRect = (): void => {
            const computeXByIndex = (i: number): number => {
                return (((i * 2 + 1) * self.width) / (dataLength * 2)) - (self.rectWidth / 2)
            }
            //make data to a 2D array
            //[
            //  [x0y0,x1y0,x2y0],
            //  [x0y1,x1y1,x2y1]  
            //]
            const findColorByTypeName = (key: string): string => {
                const typeIndex = self.state.typeObjList.findIndex(type => type.name === key)
                return self.state.typeObjList[typeIndex]['color']
            }
            const dataUpdate = self.rectContainerGSelect.selectAll('g').data(stackedData)
            const dataEnter = dataUpdate.enter()
                .append('g')
                .attr('fill', d => findColorByTypeName(d.key))
                .selectAll('rect')
                .data(d => d)
                .enter()
                .append('rect')
                .on("mouseover", (d, i) => self.handleMouseOver(d, i))
                .on("mouseout", () => self.handleMouseOut())
                .transition()
                .attr("width", self.rectWidth)
                .attr("x", (d, i) => computeXByIndex(i))
                .attr("y", d => self.yScale(d[1]))
                .attr("height", d => self.yScale(d[0]) - self.yScale(d[1]))
            const allRectUpdate = dataUpdate
                .attr('fill', d => findColorByTypeName(d.key))
                .selectAll('rect')//  [x0y0,x1y0,x2y0]
                .data(d => d)
            allRectUpdate
                .transition()
                .attr("x", (d, i) => computeXByIndex(i))
                .attr("y", d => self.yScale(d[1]))
                .attr("height", d => self.yScale(d[0]) - self.yScale(d[1]))
            const rectExit = allRectUpdate
                .exit()
                .remove()
            const rectEnter = allRectUpdate
                .enter()
                .append('rect')
                .on("mouseover", (d, i) => self.handleMouseOver(d, i))
                .on("mouseout", () => self.handleMouseOut())
                .transition()
                .attr("width", self.rectWidth)
                .attr("x", (d, i) => computeXByIndex(i))
                .attr("y", d => self.yScale(d[1]))
                .attr("height", d => self.yScale(d[0]) - self.yScale(d[1]))
        }
        drawXAxis()
        drawYAxis()
        drawRect()
    }
    setColor = () => {
        const colormaker = d3.scaleOrdinal(d3.schemeCategory10);
        let tempTypeShow = this.state.typeObjList.map((type) => {
            return {
                ...type, color: colormaker(type.name)
            }
        })
        this.setState({ ...this.state, typeObjList: tempTypeShow })
    }
    handleDataUsed = (): void => {
        const self = this
        let dataUsed: strKeyObj[] = []
        let typeObjList = [...this.state.typeObjList]
        const setDataUsed = () => {
            //make dataUsed to
            //{產業:xxx,typeName:yyy}
            self.state.industryShowList.forEach(industryIndex => {
                let tempObj: strKeyObj = {}
                tempObj['產業'] = (industryNameList as strKeyObj)[industryIndex]
                self.state.typeObjList.forEach((typeObj: IType) => {
                    tempObj[typeObj.name] = self.originalData[industryIndex][typeObj.name]
                })
                dataUsed.push(tempObj)
            });
        }
        const sortData = () => {
            const sortedTypeName = self.state.sortedBy
            if (sortedTypeName !== 'sum') {
                dataUsed.sort((a, b) => {
                    return a[sortedTypeName] - b[sortedTypeName]
                })
                const typeIndex = typeObjList.findIndex(typeObj => typeObj.name === sortedTypeName)
                const typeCopy = { ...typeObjList[typeIndex] }
                if (typeIndex !== 0) {
                    typeObjList.splice(typeIndex, 1)
                    typeObjList.unshift(typeCopy)
                }
            } else {
                dataUsed.sort((a, b): number => {
                    const computeTypeObjSum = (typeObjForSum: strKeyObj): number => {
                        let sum = 0
                        self.state.typeObjList.forEach((typeObj: IType) => {
                            sum += Number(typeObjForSum[typeObj.name])
                        })
                        return sum
                    }
                    return computeTypeObjSum(a) - computeTypeObjSum(b)
                })
            }
        }
        const computeMaxValueSumInDataUsed = (): number => {
            //d3.map(singleIndustryObj).values() which means 
            //get a array of all value in singleIndustryObj
            //then get the sum of the array
            //means each industry has one number in a array
            //the number is the sum of all key in industry
            //final find the max of all array
            //let the max-value be the max-value of yAxis
            if (self.state.industryShowList.length > 0) {
                return (d3.max(dataUsed.map((singleIndustryObj) => {
                    return d3.sum(d3.map(singleIndustryObj).values())
                }
                )) as number)
            }
            else {
                return 50000
            }
        }
        const stackedData = () => {
            return d3.stack()
                .keys(typeObjList.map(typeObj => typeObj.name))
                (dataUsed);
        }
        setDataUsed()
        if (self.state.sortedBy !== '') {
            sortData()
        }
        this.draw(stackedData(), computeMaxValueSumInDataUsed())
    }
    handleInformationChange = (typeName: string) => {
        this.setState({ ...this.state, sortedBy: typeName }, () => this.handleDataUsed())
    }
    handleIndustryChange = (value: string): void => {
        if (this.state.industryShowList.indexOf(value) !== -1) {
            //if the checkbox is already checked, delete it.
            const index = this.state.industryShowList.findIndex(industry => industry === value)
            let tempArr: string[] = [...this.state.industryShowList]
            tempArr.splice(index, 1)
            this.setState({ ...this.state, industryShowList: [...tempArr] }, () => {
                this.handleDataUsed()
            })
            return
        }
        this.setState({ ...this.state, industryShowList: [...this.state.industryShowList, value] }, () => {
            this.handleDataUsed()
        })
    }
    handleSortedByChange = (typeName: string) => {
        this.setState({ ...this.state, sortedBy: typeName }, () => this.handleDataUsed())
    }
    componentDidMount() {
        const initData = async (): Promise<void> => {
            try {
                this.originalData = await d3.csv(`${process.env.PUBLIC_URL}/data8.csv`)
            } catch (err) {
                alert('抓資料時發生錯誤，請重開')
            }
        }
        initData().then(() => {
            this.initDraw()
            this.handleSortedByChange('')
        })
    }
    render() {
        const notificationStyle: React.CSSProperties = {
            left: 150,
            top: 50,
            zIndex: 100000,
            position: 'absolute',
            backgroundColor: 'white',
            display: this.state.isAlertShow ? 'block' : 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
            borderRadius: 8,
            fontSize: 8,
            margin: 0,
            padding: 0
        }
        return (
            <div className="App">

                <section>
                    <span style={{ marginRight: 15 }}>108年</span>
                    <span>
                        {/*
                        <span>資訊</span>
                        <span style={{ marginRight: 10 }}>
                            <input type="radio"
                                id="salary"
                                value='salary'
                                onChange={e => this.handleInformationChange(e.target.value)}
                                checked={this.state.informationShow === 'salary'} />
                            <label htmlFor="salary">薪水</label>
                        </span>
                        <span>
                    <input type="radio" id="flu" name="information" value='2' onChange={(e) => handleInformationChange(e)} />
                    <label htmlFor="flu">流動率</label>
                  </span>
                  <span>
                    <input type="radio" id="workTime" name="information" value='3' onChange={(e) => handleInformationChange(e)} />
                    <label htmlFor="workTime">工時</label>
                  </span>*/}
                    </span>
                    <span>
                        <span style={{ marginRight: 15 }}>排列</span>
                        {this.state.typeObjList.map((typeObj: IType) =>
                            <span key={typeObj.name} style={{ marginRight: 15 }}>
                                <input type="radio"
                                    id={`sortedBy${typeObj.name}`}
                                    checked={this.state.sortedBy === typeObj.name}
                                    onChange={() => this.handleSortedByChange(typeObj.name)} />
                                <label htmlFor={`sortedBy${typeObj.name}`}>{typeObj.name}</label>
                            </span>)}
                        <span style={{ marginRight: 15 }}>
                            <input type="radio"
                                id="sortedBySum"
                                checked={this.state.sortedBy === "sum"}
                                onChange={() => this.handleSortedByChange('sum')} />
                            <label htmlFor="sortedBySum">總和</label>
                        </span>
                        <span>
                            <input type="radio"
                                id="sortedByNone"
                                checked={this.state.sortedBy === ""}
                                onChange={() => this.handleSortedByChange('')} />
                            <label htmlFor="sortedByNone">無排列</label>
                        </span>
                    </span>

                </section>
                <section style={{ display: 'flex' }}>
                    <aside >
                        <div>產業</div>
                        {industryNameList.map((industry, index) =>
                            <div key={index}>
                                <input type="checkbox"
                                    checked={this.state.industryShowList.indexOf(String(index)) !== -1}
                                    value={index}
                                    id={`industry${index}`}
                                    onChange={e => this.handleIndustryChange(e.target.value)} />
                                <label htmlFor={`industry${index}`}>{industry}</label>
                            </div>
                        )}
                    </aside>
                    <main style={{ position: 'relative' }}>
                        <section style={notificationStyle}>
                            {this.state.alertText}
                        </section>
                        <svg id="svgSection"></svg>
                    </main>
                </section>
            </div>
        );
    }
}
