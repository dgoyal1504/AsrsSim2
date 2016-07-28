console.log('Hello world');
/*
  Node logic -
    Waiting for tote in inputQueue (nodeClock = Time of NextTote)
    Picked tote from queue <Q1 > to queue < Q2>  (Tote.waitTime += NodeTime - Tote.currentTime, NodeTime += ProcessTime,  Tote.currentTime = NodeTime + queue2 queueDelay)
    Blocked on queue <> (NodeTime += skipTime
*/
Position = function (aisle, level, index) {
    this.aisle = aisle;
    this.level = level;
    this.index = index;
    this.side = "";
    this.depth = "";
}

Mask = function (aisle, level, index) {
    this.aisle = aisle;
    this.level = level;
    this.index = index;
}
function checkMask(pos, mask) {
    retCode = 1;
    if ((mask.aisle != null) && (mask.aisle != pos.aisle))
        return 0;
    if ((mask.level != null) && (mask.level != pos.level))
        return 0;
    if ((mask.index != null) && (mask.index != pos.index))
        return 0;
    return 1;
}
Element = function (id, barCode, type, insertTime, location) {
    this.type = type; // Carton, Tote, task
    this.id = id;
    this.barCode = barCode;
    this.insertTimeQ = insertTime;  // Time when this element was inserted in queue
    this.availableTimeQ; // Time when this item will ideally be available for pick, this will change if prior item is stuck. Hence after pick, item[i].availableTimeQ = item[i].insertTimeQ + item[i-1].availableTimeQ - item[i-1].insertTimeQ 
    this.waitTime = 0; 	// Total time this element waited to get processed
    this.currentQ = null; // Q - S
    this.currentLocation; //
    this.q = null; // Q - S
    this.location = location;  // AA, LL, PPP	- TBD
}
Queue = function (id, name, type, size) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.size = size;
    this.queueDelay = 0; // Time for an item to travel through this queue. If an item is inserted at time t, it is available at end, no earlier than t + queueDelay
    this.store;
    if (this.type == 'Q') this.store = [];
    else this.store = new Array(size); // Storage

	/*
	//	Queue.peek(atTime, position) - return element or null. Element stays on Queue
	*/

    this.peek = function (atTime, position) {
        if (this.type == 'Q') {
            if (typeof position != 'undefined') console.log(this.id + ":" + this.name + ":" + this.type + ":getFromPosition =" + position);
            if (this.store.length == 0) return null;
            if ((typeof this.store[0].currentTime == 'undefined') || (this.store[0].currentTime <= atTime)) // Element is visible
                return this.store[0];
            else
                return null;
        } else {
            // Storage	
            // We do not need to check for current time because an item is available when it is in a location 
            if (this.store.length == 0) return null;
            if (typeof position != 'undefined') {
                var element = this.store[position];
                return element;
            } else {
                console.log(this.id + ":" + this.name + ":" + this.type + ":getFromPosition =" + position);
                return null;
            }
        }
    }

	/*
	// Queue.get() - return element or null. Element is removed from Queue. If Queue was a storage, it is replaced by a null.
	*/

    this.get = function (atTime, position) {
        //console.log("Node peek at time " + atTime);
        if (this.type == 'Q') {
            if (typeof position != 'undefined') console.log(this.id + ":" + this.name + ":" + this.type + ":getFromPosition =" + position);
            if (this.store.length == 0) return null;

            if ((typeof this.store[0].currentTime == 'undefined') || (this.store[0].currentTime <= atTime)) // Element is visible
            {
                e2 = this.store.shift();
                if ((this.store.length > 0) && (this.store[0].currentTime <= atTime)) {
                    console.log("Modifying element time " + this.store[0].barCode + ":currentTime=" + this.store[0].currentTime + ":atTime=" + atTime);
                    this.store[0].waitTime += atTime - this.store[0].currentTime;
                    this.store[0].currentTime = atTime;  // Next element is visible no earlier than arrival time 
                }
                // time this item was waiting

                return e2;
            }
            else
                return null;
        } else {
            // Storage	
            if (this.store.length == 0) return null;
            if (typeof position != 'undefined') {
                var element = this.store[position];
                this.store[position] = null;
                return element;
            } else {
                console.log(this.id + ":" + this.name + ":" + this.type + ":getFromPosition =" + position);
                return null;
            }
        }

    };

	/*  
	// Queue.put(element, position) - returns 1 on success, 0 on failure
	//
	*/
    this.put = function (element, atTime, position) {  // Return 1 on success, return 0 on failure
        if (this.type == 'Q') {
            if (typeof position != 'undefined') console.log(this.id + ":" + this.name + ":" + this.type + ":invalid position for Q - putPosition =" + position);
            if (this.store.length >= this.size)
                return 0; // failure
            element.currentTime = atTime + this.queueDelay;
            this.store.push(element);
            return 1; // success
        } else {
            // storage
            element.currentTime = atTime + this.queueDelay; // queueDelay is zero - so it does not matter.. 
            if (typeof position != 'undefined') {
                if (position >= size) {
                    console.log(this.id + ":" + this.name + ":" + this.type + ":size overrun putPosition =" + position);
                    return 0;

                }
                this.store[position] = element;
                return 1;
            } else {
                console.log(this.id + ":" + this.name + ":" + this.type + ":undefined position - putPosition =" + position);
                return 0;
            }

        }
    }

}
Element = function (id, barCode, type, insertTime, location) {
    this.type = type; // Carton, Tote
    this.id = id;
    this.barCode = barCode;
    this.insertTime = insertTime;  // Time when this element was inserted in queue
    this.currentTime = this.insertTime; // Time when this element is visible for next processing
    this.waitTime = 0; 	// Total time this element waited to get processed
    this.currentQ = null; // Q - S
    this.currentLocation; //
    this.q = null; // Q - S
    this.location = location;  // AA, LL, PPP	
}
Node = function (id, name, type, sequence, inQArray, outQArray, errQ, mask) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.sequence = sequence;
    this.inQArray = inQArray; // Merge will have 2 inQ
    this.outQArray = outQArray; // Divert will have 2 outQ, Lift and OLS will have multiple outQ
    this.errQ = errQ;
    this.currentTime = 0; // Current clock of this node
    this.processTime = 5; // Time per move process
    this.skipTime = 1;   // Minimum time whether block or success
    this.blockTime = 0;  // Time we waited for outQ to be available (inQ has something but outQ are blocked) - "we wont know this till there is something to be processed!"
    this.waitTime = 0;   // Time we waited for an item to be available in inQ
    this.mask = mask;
    this.state = 0; /* 0 - wait, 1-Blocked */

    this.process = function () {
        //this.currentTime += this.skipTime; //We will move clock so that next node can get a turn
        switch (this.type) {
            //D, iL, S, oL, M
            case 'D':// divert read from divQ and send to ILq

                // Peek element in inQ, if mask and space in outQ, send to outQ, if space in outQ send to errQ, else leave

                inQ = this.inQArray[0]; // Only first element is important
                outQ = this.outQArray[0];
                if ((e1 = inQ.peek(this.currentTime)) != null) { // There is something to be processed 
                    if ((outQ.size == outQ.store.length) && (errQ.size == errQ.store.length)) { // Output Queues are full, we are blocked
                        console.log("Node " + this.id + ":" + this.name + ":" + this.type + " found no space in outQ or ErrQ, will wait");
                        this.blockTime += this.skipTime; // e1.currentTime - this.currentTime; // Need to think over this..
                        console.log("Check logic ofr node.process for divert.. Wait times");
                        this.currentTime += this.skipTime;
                        return 0;
                    }
                    e2 = inQ.get(this.currentTime); // element's wait time is already corrected
                    this.currentTime += this.processTime;
                    if ((outQ.size > outQ.store.length) && (checkMask(e2.location, this.mask))) {
                        console.log("Node " + this.id + ":" + this.name + ":" + this.type + " inserting event in outQ: " + outQ.name);
                        outQ.put(e2, this.currentTime);
                    } else if (errQ.size > errQ.store.length) {
                        console.log("Node " + this.id + ":" + this.name + ":" + this.type + " inserting event in errQ: " + errQ.name);
                        errQ.put(e2, this.currentTime);
                    }
                    return 1;
                } else {
                    console.log("Node " + this.id + ":" + this.name + ":" + this.type + " has nothing in input Q");
                    this.currentTime += this.skipTime;
                    return 0;
                };
            case 'IL'://Ib Lift - read from ILq and send to LSq

                // Peek element in inQ, if mask and space in outQ, send to outQ, if space in outQ send to errQ, else leave

                inQ = this.inQArray[0]; // Only first element is important

                if ((e1 = inQ.peek(this.currentTime)) != null) { // There is something to be processed 
                    level = e1.location.level;
                    outQ = this.outQArray[level - 1];
                    //if ((outQ.size == outQ.store.length) && (errQ.size == errQ.store.length)) { // Output Queues are full, we are blocked
                    if (outQ.size == outQ.store.length) {
                        console.log("Node " + this.id + ":" + this.name + ":" + this.type + " found no space in outQ or ErrQ, will wait");
                        this.blockTime += this.skipTime; // e1.currentTime - this.currentTime; // Need to think over this..
                        console.log("Check logic ofr node.process for divert.. Wait times");
                        this.currentTime += this.skipTime;
                        return 0;
                    }
                    e2 = inQ.get(this.currentTime);
                    this.currentTime += this.processTime;
                    if ((outQ.size > outQ.store.length) && (checkMask(e2.location, this.mask))) {
                        console.log("Node " + this.id + ":" + this.name + ":" + this.type + " inserting event in outQ: " + outQ.name);
                        outQ.put(e2, this.currentTime);
                    } else if (errQ.size > errQ.store.length) {
                        console.log("Node " + this.id + ":" + this.name + ":" + this.type + " inserting event in errQ: " + errQ.name);
                        errQ.put(e2, this.currentTime);
                    }
                    return 1;
                } else {
                    console.log("Node " + this.id + ":" + this.name + ":" + this.type + " has nothing in input Q");
                    this.currentTime += this.skipTime;
                    return 0;
                };
            case 'S'://Shuttle - read from ILq, put in storage, read from Stq, put in LOq
                ;
            case 'OL'://outbound lift - read from LOq and put in AOq
                ;
            case 'M':// Merge - read from AO1q and AO2q and put in Oq
                ;
            default:
                ;
        }

        return -1; //indicates that no tote was processed
        //return 1; // indicates that a tote was processed
    }
}
//--- Test
pos1 = new Position(1, 1, 1);
mask = new Mask(1, null, null);
console.log("Result of check mask is " + checkMask(pos1, mask));
qD1inQ = new Queue(1, 'D1inQ', 'Q', 5);
qL1inQ = new Queue(2, 'L1inQ', 'Q', 2);
qD2inQ = new Queue(3, 'D2inQ', 'Q', 2);
nD1 = new Node(1, 'Divert1', 'D', 1, [qD1inQ], [qL1inQ], qD2inQ, mask);

tote1 = new Element(1, '0001', 'C', 1, pos1);
tote2 = new Element(2, '0002', 'C', 4, new Position(1, 1, 2));
tote3 = new Element(3, '0003', 'C', 6, new Position(1, 1, 3));
tote4 = new Element(4, '0004', 'C', 7, new Position(1, 1, 4));
tote5 = new Element(5, '0005', 'C', 8, new Position(1, 1, 5));

qD1inQ.put(tote1, 1);
qD1inQ.put(tote2, 4);
qD1inQ.put(tote3, 6);
qD1inQ.put(tote4, 7);
qD1inQ.put(tote5, 8);