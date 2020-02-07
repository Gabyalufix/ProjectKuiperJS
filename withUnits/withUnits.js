// General Use Functions

function checkUnits(units1, units2) { // Check that two units are the same

    if (production) {
        return true
    }
    else {

        var unitsSame = true;

        // Iterate through each unit. If a difference if found, change the flag
        for (var unit in units1) {
            if (units1[unit] != units2[unit]) {
                unitsSame = false;
            }
        }

        return unitsSame;
    }
}

function parseUnits(input) { // Parse the main units

    var output;

    // Set initial units
    var units = baseUnits;

    // Set the initial value multiplier
    var value = 1;

    if (storedUnits[input]) {
        output = storedUnits[input]
    }
    else {


        // Split up the initial input
        var unitsList = input.split(" ")
        var newUnitsList = [];

        // Set initial slash index
        var slashIndex = -1;

        // Break up all sections and find where the slash is - keep track in slashIndex
        for (var section in unitsList) {

            if (unitsList[section].indexOf("/") != -1) {
                slashIndex = Number(section);
                newUnitsList.push(unitsList[section].split("/")[0]);
                newUnitsList.push(unitsList[section].split("/")[1]);
            }
            else {
                newUnitsList.push(unitsList[section]);
            }

        }

        // Set the units list
        unitsList = newUnitsList;

        // Iterate through each segment in the units list "kg m/s^2" -> "kg"
        for (var index in unitsList) {
            // For a segment such as kg^2 m/s^2

            var section = unitsList[index]; // "kg^2", "m", "s^2"
            var fullBase = section; // "kg^2", "m", "s^2"
            var baseUnit = section.substr(1, section.length - 1) // "g^2", "", "^2" 
            var basePrefix = section.substr(0, 1); // "k", "m", "s"

            // Create the initial power from this segment
            var power = 1;

            // Flip the power multiplier if it's after the slash
            var multiplier = 1;
            if (index > slashIndex && slashIndex != -1) {
                multiplier = -1
            }

            // If it has a power hat
            if (section.indexOf("^") != -1) {
                fullBase = section.substr(0, section.indexOf("^")); // "kg", "s"
                baseUnit = section.charAt(1, section.indexOf("^") - 1) // "g", ""
                basePrefix = section.substr(0, 1); // "k", "s"
                power = Number(section.substr(section.indexOf("^") + 1)); // 2, 2
            }

            if (baseUnit == "") {
                basePrefix = "";
                baseUnit = fullBase;
            }

            if (fullBase == "kg") { // Kilogram's kinda weird - it's SI, not gram
                baseUnit = "kg";
                basePrefix = "";
            }

            if (fullBase == "c") { // If it's in terms of the speed of light, just deal with that
                value = 299792458;
                units["m"] += 1 * multiplier * power;
                units["s"] -= 1 * multiplier * power;
            }
            else if (fullBase == "degree" || fullBase == "degrees") { // If it's in degrees, just modify the value
                value = Math.PI / 180;
            }
            else if (allUnits[fullBase]) {

                units[fullBase] += 1 * multiplier * power;
            }
            else if (classes[fullBase]) { // If it's a spin on an SI unit

                // Get the type
                var type = classes[fullBase];

                if (type == "m") { // If it's a distance find the conversion
                    value *= convertDistanceUnits(fullBase, multiplier * power)
                }

                if (type == "s") { // If it's a time, find the conversion
                    value *= convertTimeUnits(fullBase, multiplier * power)
                }

                // Add the units into the main units array
                units[type] += 1 * multiplier * power;
            }
            else {
                if (contractions[baseUnit]) { // If it's a contraction, add the contraciton as the unit
                    for (var unit in units) {
                        units[unit] += multiplier * contractions[baseUnit][unit];
                    }
                }
                else if (contractions[fullBase]) { // If it's a contraction, add the contraciton as the unit
                    for (var unit in units) {
                        units[unit] += multiplier * contractions[fullBase][unit];
                    }
                }
                else if (allUnits[baseUnit]) { // If it's an SI unit, pour it in
                    units[baseUnit] += 1 * multiplier * power;
                }
                else if (allUnits[fullBase]) { // If it's an SI unit, pour it in
                    units[fullBase] += 1 * multiplier;
                }


                if (prefixes[basePrefix]) { // If it comes with a prefix, modify the value by the stored prefix
                    value *= prefixes[basePrefix]
                }
            }

        }


        output = [units, value]

        storedUnits[input] = output

    }

    // Return both the units and value
    return output
}

function convertTimeUnits(from, pow) { // Convert any time from a format to a format with a given power
    if (pow == undefined) {
        pow = 1;
    }
    var value = 1;

    if (from == "s") {
        value = 1;
    }
    else if (from == "min") {
        value = 60;
    }
    else if (from == "h") {
        value = 60 * 60;
    }
    else if (from == "d") {
        value = 60 * 60 * 24;
    }
    else if (from == "y") {
        value = 60 * 60 * 24 * 365.2422;
    }

    var finalValue = Math.pow(value, pow);

    return finalValue;
}

function convertDistanceUnits(from, pow) { // Convert any distance from anything to anything, and with a power modifier

    if (pow == undefined) {
        pow = 1;
    }
    var value = 1;

    if (from == "m") {
        value = 1;
    }
    else if (from == "AU") {
        value = 149597870700;
    }
    else if (from == "LY") {
        value = (60 * 60 * 24 * 365.2422) * 299792458;
    }
    else if (from == "pc") {
        value = 3.08567758 * Math.pow(10, 16);
    }

    var finalValue = Math.pow(value, pow);

    return finalValue;
}

function turnNumberToScalar(number) { // Convert a number into a scalar in the data type
    var scalar = {
        value: number,
        units: baseUnits,
        type: "scalar",
    }
    return scalar
}

// Input Parsing Functions

function parseScalarInput(value, units) { // Input a scalar value with a units string and return a scalar in the data type
    var data;
    if (units != "") {
        data = parseUnits(units)
    }
    else {
        data = [baseUnits, 1]
    }

    // Create new scalar
    var scalar = {
        value: value * data[1],
        units: data[0],
        type: "scalar",
    }
    return scalar;
}

function parseVectorInput(vector, units) { // Input a vector value ([x,y,z]) with a units string and return a vector in the data type

    // Check it's a vector
    if (vector.length == 3) {
        var data;
        if (units != "") {
            data = parseUnits(units)
        }
        else {
            data = [baseUnits, 1]
        }

        // Create new vector
        var value = {
            vector: [vector[0] * data[1], vector[1] * data[1], vector[2] * data[1]],
            units: data[0],
            type: "vector",
        }
        return value;
    }
    else {
        throw new Error("ERROR: Input is not a vector")
    }
}

// Specific Output Functions

function outputScalar(scalar, units) { // Output a scalar value in the given units
    var data;
    if (units != "") {
        data = parseUnits(units)
    }
    else {
        data = [baseUnits, 1]
    }

    // As long as it's a scalar
    if (scalar.type == "scalar") {

        // And in the same dimensions
        if (checkUnits(scalar.units, data[0])) {

            // Return the scalar value moderated to be in the resultant units
            return scalar.value / data[1]
        }
        else {
            throw new Error("ERROR: Output must be in terms of the same units")
        }
    }
    else {
        throw new Error("ERROR: Input must be a scalar")
    }
}

function outputVector(vector, units) {
    var data;
    if (units != "") {
        data = parseUnits(units)
    }
    else {
        data = [baseUnits, 1]
    }

    // As long as it's a vector
    if (vector.type == "vector") {

        // And in the same dimensions
        if (checkUnits(vector.units, data[0])) {

            // Return the vector value, moderated to be in the resultant units
            return [vector.vector[0] / data[1], vector.vector[1] / data[1], vector.vector[2] / data[1]]
        }
        else {
            throw new Error("ERROR: Output must be in terms of the same units")
        }
    }
    else {
        throw new Error("ERROR: Input must be a vector")
    }
}

// Basic Manipulation Functions

function add(value1, value2) { // Add two vectors or two scalars together

    // If either input is a number, turn it into a scalar for use in the program
    if (!isNaN(value1)) {
        value1 = turnNumberToScalar(value1)
    }

    if (!isNaN(value2)) {
        value2 = turnNumberToScalar(value2)
    }

    var unitsSame = true;
    if (!production) {
        unitsSame = checkUnits(value1.units, value2.units)
    }

    // If the units match
    if (unitsSame) {

        // And both inputs are of the same type
        if (value1.type == value2.type) {

            // If it's a vector
            if (value1.type == "vector") {
                var v1 = value1["vector"]
                var v2 = value2["vector"]

                // Create the resultant vector
                var finalValue = {
                    vector: [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]],
                    units: value1["units"],
                    type: "vector"
                }

                return finalValue;
            }
            else { // It's a scalar

                // Create the resultant scalar
                var finalValue = {
                    value: value1["value"] + value2["value"],
                    units: value1["units"],
                    type: "scalar"
                }

                return finalValue;
            }
        }
        else {
            throw new Error("ERROR: You must add either two vectors or two scalars")
        }
    }
    else {
        throw new Error("ERROR: The units must be the same to add")
    }
}

function subtract(value1, value2) { // Subtract a value from another value

    // If either is just a plain number, turn it into a data type scalar
    if (!isNaN(value1)) {
        value1 = turnNumberToScalar(value1)
    }

    if (!isNaN(value2)) {
        value2 = turnNumberToScalar(value2)
    }

    var unitsSame = true;
    if (!production) {
        unitsSame = checkUnits(value1.units, value2.units)
    }

    // Check if the units are the same
    if (unitsSame) {

        // Check if they're both of type
        if (value1.type == value2.type) {
            if (value1.type == "vector") { // If it's a vector
                var v1 = value1["vector"]
                var v2 = value2["vector"]

                // Create the resultant value
                var finalValue = {
                    vector: [v1[0] - v2[0], v1[1] - v2[1], v1[2] - v2[2]],
                    units: value1["units"],
                    type: "vector"
                }

                return finalValue;
            }
            else { // If it's a scalar

                // Create the resultant value
                var finalValue = {
                    value: value1["value"] - value2["value"],
                    units: value1["units"],
                    type: "scalar"
                }

                return finalValue;
            }
        }
        else {
            throw new Error("ERROR: You must add either two vectors or two scalars")
        }
    }
    else {
        throw new Error("ERROR: The units must be the same to add")
    }
}

function multiply(value1, value2) { // Multiply two values - two scalars or a scalar and a vector
    var vector;
    var scalar;
    var scalar2;

    // If either is a plain number, turn it into a scalar
    if (!isNaN(value1)) {
        value1 = turnNumberToScalar(value1)
    }

    if (!isNaN(value2)) {
        value2 = turnNumberToScalar(value2)
    }

    // Determine which variables to assign each value to
    if (value1.type == "vector" && value2.type == "scalar") {
        vector = value1;
        scalar = value2;
    }
    else if (value1.type == "scalar" && value2.type == "vector") {
        vector = value2;
        scalar = value1
    }
    else if (value1.type == "scalar" && value2.type == "scalar") {
        scalar2 = value2;
        scalar = value1
    }

    // If multiplying a vector by a scalar
    if (vector) {

        // Create the final vector
        var finalVector = {
            vector: [0, 0, 0],
            units: baseUnits,
            type: "vector"
        }

        // Establish the units of the final vector
        if (!production) {
            for (var unit in finalVector["units"]) {
                finalVector["units"][unit] = vector["units"][unit] + scalar["units"][unit]
            }
        }

        // Establish the values of each dimsion of the final vector
        for (var index in finalVector.vector) {
            finalVector.vector[index] = scalar.value * vector.vector[index]
        }

        return finalVector;

    }
    else if (scalar2) { // If there's a second scalar, it's scalar X scalar

        // Create scalar
        var finalValue = {
            value: 0,
            units: baseUnits,
            type: "scalar"
        }

        // Establish the units of the final scalar
        if (!production) {
            for (var unit in finalValue["units"]) {
                finalValue["units"][unit] = scalar["units"][unit] + scalar2["units"][unit]
            }
        }

        // Determin the final value of the scalar
        finalValue["value"] = scalar["value"] * scalar2["value"]

        return finalValue;

    }
    else {
        throw new Error("ERROR: Multiplication must be between two scalars or one vector and a scalar")
    }
}

function divide(value1, value2) { // Divide two values by another - a vector by scalar, or a scalar by a scalar

    // If either is a plain number, turn it into a scalar
    if (!isNaN(value1)) {
        value1 = turnNumberToScalar(value1)
    }

    if (!isNaN(value2)) {
        value2 = turnNumberToScalar(value2)
    }

    // Determine how to assign the values
    var vector;
    var scalar;
    var scalar2;

    if (value1.type == "vector" && value2.type == "scalar") {
        vector = value1;
        scalar = value2;
    }
    else if (value1.type == "scalar" && value2.type == "scalar") {
        scalar2 = value2;
        scalar = value1
    }

    if (vector) { // If it's vector/scalar

        // Create the final vector
        var finalVector = {
            vector: [0, 0, 0],
            units: baseUnits,
            type: "vector"
        }

        // Establish the final units
        if (!production) {
            for (var unit in finalVector["units"]) {
                finalVector["units"][unit] = vector["units"][unit] - scalar["units"][unit]
            }
        }

        // Establish the final values of each dimension
        for (var index in finalVector.vector) {
            finalVector.vector[index] = vector.vector[index] / scalar.value
        }
        return finalVector;
    }
    else if (scalar2) { // If it's scalar/scalar

        // Create the final scalar
        var finalValue = {
            value: 0,
            units: baseUnits,
            type: "scalar"
        }

        // Establsih the final units
        if (!production) {
            for (var unit in finalValue["units"]) {
                finalValue["units"][unit] = scalar["units"][unit] - scalar2["units"][unit]
            }
        }

        // Establish the final value
        finalValue["value"] = scalar["value"] / scalar2["value"]

        return finalValue;
    }
    else { // You cannot divide by a vector
        throw new Error("ERROR: Division must be either vector/scalar or scalar/scalar")
    }
}

function pow(value, power) { // Raise a scalar or a vector to a power

    // If it's a plain number, turn it into a scalar
    if (!isNaN(value)) {
        value = turnNumberToScalar(value)
    }

    if (value.type == "scalar") { // If raising a scalar

        // Create final value
        var finalValue = {
            value: 0,
            units: baseUnits,
            type: "scalar"
        }

        // Establish final value
        finalValue.value = Math.pow(value.value, power);

        // Establish final units
        if (!production) {
            for (var unit in value["units"]) {
                finalValue["units"][unit] = value["units"][unit] * power
            }
        }

        // Check units to confirm there is no half-units
        var unitsOkay = true;
        if (!production) {
            for (var unit in finalValue.units) {
                if (finalValue.units[unit] % 1 != 0) {
                    unitsOkay = false;
                }
            }
        }

        if (unitsOkay) {
            return finalValue;
        }
        else {
            throw new Error("ERROR: You cannot have half a unit")
        }

    }
    else if (value.type == "vector") {

        // Create final vector
        var finalVector = {
            vector: [0, 0, 0],
            units: baseUnits,
            type: "vector"
        }

        // Establish final value of each dimension
        for (var index in value.vector) {
            finalVector.vector[index] = Math.pow(value.vector[index], power);
        }

        // Establish final units
        if (!production) {
            for (var unit in value["units"]) {
                finalVector["units"][unit] = value["units"][unit] * power
            }
        }

        // Check there are no half-units
        var unitsOkay = true;
        if (!production) {
            for (var unit in finalVector.units) {
                if (finalVector.units[unit] % 1 != 0) {
                    unitsOkay = false;
                }
            }
        }

        if (unitsOkay) {
            return finalVector;
        }
        else {
            throw new Error("ERROR: You cannot have half a unit")
        }
    }
}

// Vector-Specific Manipulation Functions

function dotProductVector(vector1, vector2) { // Take the dot product of two vectors

    // Create final value
    var finalValue = {
        value: 0,
        units: baseUnits,
        type: "scalar"
    }

    // Check both are vectors
    var v1 = vector1.vector;
    var v2 = vector2.vector;
    if (vector1.type == "vector" && vector2.type == "vector") {

        // Establish final value
        var value = (v1[0] * v2[0]) + (v1[1] * v2[1]) + (v1[2] * v2[2]);
        finalValue["value"] = value;

        // Establish final units
        if (!production) {
            for (var unit in finalValue["units"]) {
                finalValue["units"][unit] = vector1["units"][unit] + vector2["units"][unit]
            }
        }
        return finalValue;
    }
    else {
        throw new Error("ERROR: Dot Product must be of two vectors")
    }

}

function crossProductVector(vector1, vector2) { // Take the cross product of two vectors

    // Create final vector
    var finalVector = {
        vector: [0, 0, 0],
        units: baseUnits,
        type: "vector"
    }

    // Check both are vectors
    var v1 = vector1.vector;
    var v2 = vector2.vector;
    if (vector1.type == "vector" && vector2.type == "vector") {

        // Establish final value
        var vector = [v1[1] * v2[2] - v1[2] * v2[1], v1[2] * v2[0] - v1[0] * v2[2], v1[0] * v2[1] - v1[1] * v2[0]];
        finalVector["vector"] = vector;

        // Establish final units
        if (!production) {
            for (var unit in finalVector["units"]) {
                finalVector["units"][unit] = vector1["units"][unit] + vector2["units"][unit]
            }
        }
        return finalVector;
    }
    else {
        throw new Error("ERROR: Cross Product must be of two vectors")
    }
}

function vectorMagnitude(vector) { // Take the magnitude of a vector

    // As long as it's a vector
    if (vector.type == "vector") {

        // Create final scalar
        var finalValue = {
            value: 0,
            units: baseUnits,
            type: "scalar"
        }

        // Set the final value
        finalValue["value"] = Math.pow(Math.pow(vector["vector"][0], 2) + Math.pow(vector["vector"][1], 2) + Math.pow(vector["vector"][2], 2), 0.5)

        // Copy the units
        if (!production) {
            for (var unit in vector["units"]) {
                finalValue["units"][unit] = vector["units"][unit]
            }
        }
        return finalValue
    }
    else {
        throw new Error("ERROR: You must take magnitude of a vector")
    }
}

function setMagnitudeVector(value1, value2) { // Set the magnitude of a vector to a scalar

    var vector;
    var scalar;

    // If it's a number, make a scalar out of it
    if (!isNaN(value1)) {
        value1 = turnNumberToScalar(value1)
    }

    if (!isNaN(value2)) {
        value2 = turnNumberToScalar(value2)
    }

    // Manage which value is which
    if (value1.type == "vector" && value2.type == "scalar") {
        vector = value1;
        scalar = value2;
    }
    else if (value1.type == "scalar" && value2.type == "vector") {
        vector = value2;
        scalar = value1
    }

    var mag = vectorMagnitude(vector).value

    var unitsSame = true;
    if (!production) {
        unitsSame = checkUnits(vector.units, scalar.units)
    }
    // Check that there is a vector
    if (vector) {
        // Confirm that the dimensions of both are the same
        if (unitsSame) {

            // Create final vector
            var finalVector = {
                vector: [0, 0, 0],
                units: baseUnits,
                type: "vector"
            }

            // Find magnitude of the vector
            var mag = vectorMagnitude(vector).value;

            // Determine final value of each dimension of the vector
            for (var index in finalVector.vector) {
                finalVector.vector[index] = scalar.value * vector.vector[index] / mag
            }

            // Set the units of the resultant vector
            if (!production) {
                for (var unit in vector["units"]) {
                    finalVector["units"][unit] = vector["units"][unit]
                }
            }
            return finalVector;
        }
        else {
            throw new Error("ERROR: Units must be the same to set magnitude")
        }
    }
    else {
        throw new Error("ERROR: You must have one vector and one scalar to set the magnitude")
    }
}

function makeUnitVector(vector) { // Turn a vector into a unit vector

    // As long as it is a vector
    if (vector.type == "vector") {

        // Create final vector (with no dimensions, it just points)
        var finalVector = {
            vector: [0, 0, 0],
            units: baseUnits,
            type: "vector"
        }

        // Set the total magnitude to 1
        var mag = vectorMagnitude(vector).value;
        for (var index in finalVector.vector) {
            finalVector.vector[index] = vector.vector[index] / mag
        }
        return finalVector;
    }
    else {
        throw new Error("ERROR: You can only make a vector into a unit vector")
    }
}

// Trigonometric Manipulation Functions

function sin(value) { // Take the sin of a angle in (dimensionless) radians

    // If it's just a plain number, turn it into a scalar
    if (!isNaN(value)) {
        value = turnNumberToScalar(value)
    }

    var unitsOkay = true;
    if (!production) {
        unitsOkay = checkUnits(value.units, baseUnits)
    }

    // If it's both a scalar and has no dimensions
    if (value.type == "scalar" && unitsOkay) {

        // Create and output final scalar
        var finalValue = {
            value: Math.sin(value.value),
            units: baseUnits,
            type: "scalar"
        }

        return finalValue;
    }
    else {
        throw new Error("ERROR: You must take the sin of a scalar in radians (dimensionless)")
    }

}

function cos(value) { // Take the cos of a angle in (dimensionless) radians

    // If it's just a plain number, turn it into a scalar
    if (!isNaN(value)) {
        value = turnNumberToScalar(value)
    }

    var unitsOkay = true;
    if (!production) {
        unitsOkay = checkUnits(value.units, baseUnits)
    }

    // If it's both a scalar and has no dimensions
    if (value.type == "scalar" && unitsOkay) {

        // Create and output final scalar
        var finalValue = {
            value: Math.cos(value.value),
            units: baseUnits,
            type: "scalar"
        }

        return finalValue;
    }
    else {
        throw new Error("ERROR: You must take the cos of a scalar in radians (dimensionless)")
    }
}

function tan(value) { // Take the tan of a angle in (dimensionless) radians

    // If it's just a plain number, turn it into a scalar
    if (!isNaN(value)) {
        value = turnNumberToScalar(value)
    }

    var unitsOkay = true;
    if (!production) {
        unitsOkay = checkUnits(value.units, baseUnits)
    }

    // If it's both a scalar and has no dimensions
    if (value.type == "scalar" && unitsOkay) {

        // Create and output final scalar
        var finalValue = {
            value: Math.tan(value.value),
            units: baseUnits,
            type: "scalar"
        }

        return finalValue;
    }
    else {
        throw new Error("ERROR: You must take the tan of a scalar in radians (dimensionless)")
    }
}

function invSin(value) { // Take the inverse sin of a dimensionless scalar

    // If it's just a plain number, turn it into a scalar
    if (!isNaN(value)) {
        value = turnNumberToScalar(value)
    }

    var unitsOkay = true;
    if (!production) {
        unitsOkay = checkUnits(value.units, baseUnits)
    }

    // If it's both a scalar and has no dimensions
    if (value.type == "scalar" && unitsOkay) {

        // Create and output final angle (in dimensionless radians)
        var finalValue = {
            value: Math.asin(value.value),
            units: baseUnits,
            type: "scalar"
        }

        return finalValue;
    }
    else {
        throw new Error("ERROR: You must take the inverse sin of a dimensionless scalar")
    }
}

function invCos(value) { // Take the inverse cos of a dimensionless scalar

    // If it's just a plain number, turn it into a scalar
    if (!isNaN(value)) {
        value = turnNumberToScalar(value)
    }

    var unitsOkay = true;
    if (!production) {
        unitsOkay = checkUnits(value.units, baseUnits)
    }

    // If it's both a scalar and has no dimensions
    if (value.type == "scalar" && unitsOkay) {

        // Create and output final angle (in dimensionless radians)
        var finalValue = {
            value: Math.acos(value.value),
            units: baseUnits,
            type: "scalar"
        }

        return finalValue;
    }
    else {
        throw new Error("ERROR: You must take the inverse cos of a dimensionless scalar")
    }
}

function invTan(value) { // Take the inverse tan of a dimensionless scalar

    // If it's just a plain number, turn it into a scalar
    if (!isNaN(value)) {
        value = turnNumberToScalar(value)
    }

    var unitsOkay = true;
    if (!production) {
        unitsOkay = checkUnits(value.units, baseUnits)
    }

    // If it's both a scalar and has no dimensions
    if (value.type == "scalar" && unitsOkay) {

        // Create and output final angle (in dimensionless radians)
        var finalValue = {
            value: Math.atan(value.value),
            units: baseUnits,
            type: "scalar"
        }

        return finalValue;
    }
    else {
        throw new Error("ERROR: You must take the inverse tan of a dimensionless scalar")
    }
}

// Control Variables

var production = false;

// Essential Definitions

var baseUnits = { // Empty units array for global use
    m: 0,
    s: 0,
    kg: 0,
    A: 0,
    K: 0,
    cd: 0,
    mol: 0,
}

var classes = {
    "AU": "m",
    "LY": "m",
    "pc": "m",
    "y": "s",
    "min": "s",
    "d": "s",
    "h": "s",
};

var allUnits = { // Basic SI units
    m: true,
    s: true,
    kg: true,
    A: true,
    K: true,
    cd: true,
    mol: true,
};

var prefixes = { // Standard metric prefixes
    "y": Math.pow(10, -24),
    "z": Math.pow(10, -21),
    "a": Math.pow(10, -18),
    "f": Math.pow(10, -15),
    "p": Math.pow(10, -12),
    "n": Math.pow(10, -9),
    "µ": Math.pow(10, -6),
    "m": Math.pow(10, -3),
    "c": Math.pow(10, -2),
    "k": Math.pow(10, 3),
    "M": Math.pow(10, 6),
    "G": Math.pow(10, 9),
    "T": Math.pow(10, 12),
    "P": Math.pow(10, 15),
    "E": Math.pow(10, 18),
    "Z": Math.pow(10, 21),
    "Y": Math.pow(10, 24),
};

var storedUnits = {}

var contractions = {
    "Hz": { // Standard unit of frequency
        m: 0,
        s: -1,
        kg: 0,
        A: 0,
        K: 0,
        cd: 0,
        mol: 0,
    },
    "rad": { // Standard unit of angle
        m: 0,
        s: 0,
        kg: 0,
        A: 0,
        K: 0,
        cd: 0,
        mol: 0,
    },
    "sr": { // Standard unit of solid angle
        m: 0,
        s: 0,
        kg: 0,
        A: 0,
        K: 0,
        cd: 0,
        mol: 0,
    },
    "N": { // Standard unit of force
        m: 1,
        s: -2,
        kg: 1,
        A: 0,
        K: 0,
        cd: 0,
        mol: 0,
    },
    "Pa": { // Standard unit of pressure
        m: -1,
        s: -2,
        kg: 1,
        A: 0,
        K: 0,
        cd: 0,
        mol: 0,
    },
    "J": { // Standard unit of energy
        m: 2,
        s: -2,
        kg: 1,
        A: 0,
        K: 0,
        cd: 0,
        mol: 0,
    },
    "W": { // Standard unit of power
        m: 2,
        s: -3,
        kg: 1,
        A: 0,
        K: 0,
        cd: 0,
        mol: 0,
    },
    "C": { // Standard unit of charge
        m: 0,
        s: 1,
        kg: 0,
        A: 1,
        K: 0,
        cd: 0,
        mol: 0,
    },
    "F": { // Standard unit of electrical capacitance
        m: -2,
        s: 4,
        kg: -1,
        A: 2,
        K: 0,
        cd: 0,
        mol: 0,
    },
    "ohm": { // Standard unit of electrical resistance
        m: 2,
        s: -3,
        kg: 1,
        A: -2,
        K: 0,
        cd: 0,
        mol: 0,
    },
    "S": { // Standard unit of electrical conductance
        m: -2,
        s: 3,
        kg: -1,
        A: 2,
        K: 0,
        cd: 0,
        mol: 0,
    },
    "S": { // Standard unit of magnetic flux
        m: 2,
        s: -2,
        kg: 1,
        A: -1,
        K: 0,
        cd: 0,
        mol: 0,
    },
    "T": { // Standard unit of magnetic field strength (magnetic flux density)
        m: 0,
        s: -2,
        kg: 1,
        A: -1,
        K: 0,
        cd: 0,
        mol: 0,
    },
    "H": { // Standard unit of electrical inductance
        m: 2,
        s: -2,
        kg: 1,
        A: -2,
        K: 0,
        cd: 0,
        mol: 0,
    },
    "lm": { // Standard unit of luminous flux
        m: 0,
        s: 0,
        kg: 0,
        A: 0,
        K: 0,
        cd: 1,
        mol: 0,
    },
    "lux": { // Standard unit of illuminance
        m: -2,
        s: 0,
        kg: 0,
        A: 0,
        K: 0,
        cd: 1,
        mol: 0,
    },
    "Bq": { // Standard unit of radioactivity
        m: 0,
        s: -1,
        kg: 0,
        A: 0,
        K: 0,
        cd: 0,
        mol: 0,
    },
    "Bq": { // Standard unit of absorbed dose of ionising radiation
        m: 2,
        s: -2,
        kg: 0,
        A: 0,
        K: 0,
        cd: 0,
        mol: 0,
    },
    "Sv": { // Standard unit of equivalent dose of ionising radiation
        m: 2,
        s: -2,
        kg: 0,
        A: 0,
        K: 0,
        cd: 0,
        mol: 0,
    },
    "kat": { // Standard unit of catalytic activity
        m: 0,
        s: -1,
        kg: 0,
        A: 0,
        K: 0,
        cd: 0,
        mol: 1,
    },
}

// Global Definitions - place in destination area to prevent IDE flags

/* global sin */
/* global cos */
/* global tan */
/* global invSin */
/* global invCos */
/* global invTan */
/* global multiply */
/* global divide */
/* global pow */
/* global add */
/* global subtract */
/* global dotProductVector */
/* global crossProductVector */
/* global vectorMagnitude */
/* global setMagnitudeVector */
/* global makeUnitVector */
/* global parseScalarInput */
/* global parseVectorInput */
/* global parseUnits */
/* global convertTimeUnits */
/* global convertDistanceUnits */
/* global outputScalar */
/* global outputVector */
/* global production */
