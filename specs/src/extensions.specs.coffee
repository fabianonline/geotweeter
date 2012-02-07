describe("Extended Strings", ->
	it "should by able to be decremented", ->
		expect("123".decrement()).toEqual("122")
		expect("35213684382512100".decrement()).toEqual("35213684382512099")
		expect("10000000".decrement()).toEqual("09999999")
	
	it "should be paddable", ->
		expect("aaa".pad(10, " ")).toEqual("aaa       ")
		expect("aaaaa".pad(3, " ")).toEqual("aaaaa")
		expect("aaa".pad(5, "-")).toEqual("aaa--")
	
	it "should be repeatable", ->
		expect("aa".repeat(4)).toEqual("aaaaaaaa")
		expect("12".repeat(2)).toEqual("1212")
	
	it "should be comparable", ->
		expect("1234567".is_bigger_than("123456")).toBe(true)
		expect("1234567".is_bigger_than("12345678")).toBe(false)
		expect("1234567".is_bigger_than("1234566")).toBe(true)
		expect("1234567".is_bigger_than("1234568")).toBe(false)
)

describe("Extended Numbers", ->
	it "should be able to have a 0 added", ->
		expect(2.add_null()).toEqual("02")
		expect(12.add_null()).toEqual("12")
)