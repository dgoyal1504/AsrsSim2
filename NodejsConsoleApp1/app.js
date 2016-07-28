// JavaScript source code
// define a basic Slot
Slot = function () {
    this.status = 0x00; //available, empty
    this.content = null;
}
storage = new Array();


/*
    Position - coordinates
*/

qArray = [];
nArray = [];
eArray = [];

Position = function (aisle, level, index) {
    this.aisle = aisle;
    this.level = level;
    this.index = index;
    this.side = "";
    this.depth = "";
}
/* 
    Mask object - no functions
*/
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
Element = function (barCode, type, createTime, location) {
    this.type = type; // Carton, Tote, task
    this.id = Element.counter++;
    this.barCode = barCode;
    this.createTime = createTime;
    this.insertTimeQ;  // Time when this element was inserted in queue
    this.availableTimeQ; // Time when this item will ideally be available for pick, this will change if prior item is stuck. Hence after pick, item[i].availableTimeQ = item[i].insertTimeQ + item[i-1].availableTimeQ - item[i-1].insertTimeQ 
    this.waitTime = 0; 	// Total time this element waited to get processed
    this.currentQ = null; // Q - S
    this.currentLocation; //
    this.q = null; // Q - S
    this.location = location;  // AA, LL, PPP	- TBD
}
Element.counter = 0;
/*
    Queue is a container of elements. Queue can be a FIFO Queue - where a node processes it, or storage
*/

Queue = function (name, type, size) {
    this.id = Queue.counter++;
    this.name = name;
    this.type = type;
    this.size = size;
    this.queueDelay = 0; // Time for an item to travel through this queue. If an item is inserted at time t, it is available at end, no earlier than t + queueDelay
    // this.node = ""; // Servering node - only for true FIFO queues
    this.store; /* Store is a FIFO queue (conveyor) or an Array (storage) */
    if (this.type == 'Q') this.store = [];
    else this.store = storage; // Storage 20160719
    //else this.store = new Array(size); // Storage
    /*
	//	Queue.peek(atTime, position) - return element or null. Element stays on Queue
	*/

    this.peek = function (atTime, position) {
        if (this.type == 'Q') {
            if (typeof position != 'undefined') console.log(this.id + ":" + this.name + ":" + this.type + ":getFromPosition =" + position);
            if (this.store.length == 0) return null;
            if ((typeof this.store[0].availableTimeQ == 'undefined') || (this.store[0].availableTimeQ <= atTime)) // Element is visible
                return this.store[0];
            else
                return null;
        } else {
            // Storage	
            // We do not need to check for current time because an item is available when it is in a location 
            if (this.store.length == 0) return null;
            if (typeof position != 'undefined') {
                var element = this.store[position.aisle][position.level][aisle.index].content;
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

            if ((typeof this.store[0].availableTimeQ == 'undefined') || (this.store[0].availableTimeQ <= atTime)) // Element is visible
            {
                e2 = this.store.shift();
                // time this item was waiting
                e2.waitTime += atTime - e2.insertTimeQ - this.queueDelay;

                if (this.store.length > 0) { // There is another element in Q
                    // availableTime of next element must be modified 
                    if (1 == 0) console.log(this.name + " :Modifying time for head element " + this.store[0].barCode + ":currentTime=" + this.store[0].availableTimeQ + ":atTime=" + atTime);
                    this.store[0].availableTimeQ += atTime - e2.insertTimeQ - this.queueDelay; // increment availableTime of new queue head 
                    //this.store[0].waitTime += atTime - this.store[0].currentTime;
                    //this.store[0].currentTime = atTime;  // Next element is visible no earlier than arrival time 
                }
                return e2;
            }
            else
                return null;
        } else {
            // Storage	
            if (this.store.length == 0) return null;
            if (typeof position != 'undefined') {
                var element = this.store[position.aisle][position.level][position.index].content;
                this.store[position.aisle][position.level][position.index].content = null;
                return element;
            } else {
                console.log(this.id + ":" + this.name + ":" + this.type + ":getFromPosition =" + position);
                return null;
            }
        }

    };
    this.setHead = function (atTime) { /* only for FIFO queue, set availableTime for head to atTime */
        /* set availableTime of first queue element to atTime */
    }

    /*  
	// Queue.put(element, position) - returns 1 on success, 0 on failure
	//
	*/
    this.put = function (element, atTime, position) {  // Return 1 on success, return 0 on failure
        if (this.type == 'Q') {
            if (typeof position != 'undefined') console.log(this.id + ":" + this.name + ":" + this.type + ":invalid position for FIFO Q - putPosition =" + position);
            if (this.store.length >= this.size)
                return 0; // failure
            element.insertTimeQ = atTime;
            element.availableTimeQ = atTime + this.queueDelay;
            element.currentQ = this;
            this.store.push(element);
            return 1; // success
        } else {
            // storage
            console.log("Inserting element in storage");
            //element.currentTime = atTime + this.queueDelay; // queueDelay is zero - so it does not matter.. 
            if (typeof position != 'undefined') {
                // 20160719 - Need to define following
                /* if (position >= size) {
                    console.log(this.id + ":" + this.name + ":" + this.type + ":size overrun putPosition =" + position);
                    return 0;

                } */
                this.store[position.aisle][position.level][position.index].content = element;
                return 1;
            } else {
                console.log(this.id + ":" + this.name + ":" + this.type + ":undefined position for Storage - putPosition =" + position);
                return 0;
            }

        }
    }
}
Queue.counter = 0;
Node = function (name, type, sequence, inQArray, outQArray, errQname, mask) {
    // Constants
    this.id = Node.counter++;
    this.name = name;
    this.type = type;
    this.sequence = sequence;
    this.inQArray = inQArray; // Merge will have 2 inQ
    this.outQArray = outQArray; // Divert will have 2 outQ, Lift and OLS will have multiple outQ
    this.errQ = getQ(errQname);
    this.currentTime = 0; // Current clock of this node
    this.processTime = 5; // Time per move process
    this.skipTime = 1;   // Minimum time whether block or success
    this.mask = mask;

    // Results & output data
    this.blockTime = 0;  // Time we waited for outQ to be available (inQ has something but outQ are blocked) - "we wont know this till there is something to be processed!"
    this.waitTime = 0;   // Time we waited for an item to be available in inQ
    this.state = 0; /* 0 - wait, 1-Blocked */
    
    //-- Node type specific constants -- Shuttle, Merges etc
    this.last = 0; // Last inQ that was processed

    //-- Node type specific constants -- Merge
    this.mergeWindow = 5; // Gap needed on primary line
    this.mergeTime = 2;


    this.getIndexFromLevel = function (level, array) {
        if (array.length < level)
            return -1
        else
            return (level - 1);
    }
    this.process = function () {
        // get Tote from inQ, put tote in oQ
        // update 


        e1 = e2 = null; // Javascript Precaution - 
        //this.currentTime += this.skipTime; //We will move clock so that next node can get a turn
        switch (this.type) {
            //D, iL, S, oL, M
            case 'D':// divert read from divQ and send to ILq

                // Peek element in inQ, if mask and space in outQ, send to outQ, if space in outQ send to errQ, else leave
                errQ = this.errQ;
                inQ = getQ(this.inQArray[0]); // Only first element is important
                outQ = getQ(this.outQArray[0]);

                if ((e1 = inQ.peek(this.currentTime)) != null) { // There is something to be processed 
                    if ((outQ.size == outQ.store.length) && (errQ.size == errQ.store.length)) { // Output Queues are full, we are blocked
                        console.log("Node " + this.id + ":" + this.name + ":" + this.type + " at time " + this.currentTime + " found no space in outQ or ErrQ, will wait ");
                        this.blockTime += this.skipTime; // e1.currentTime - this.currentTime; // Need to think over this.. // Incrementing blockTime, 
                        if (1 == 0) console.log("Check logic ofr node.process for divert.. Wait times");
                        this.currentTime += this.skipTime;    // Incrementing current time
                        return 0;
                    }
                    e2 = inQ.get(this.currentTime); // element's wait time is already corrected
                    this.currentTime += this.processTime;
                    if ((outQ.size > outQ.store.length) && (checkMask(e2.location, this.mask))) {
                        console.log("Node " + this.id + ":" + this.name + ":" + this.type + " at time " + this.currentTime + " inserting event " + e2.id + " in outQ: " + outQ.name);
                        outQ.put(e2, this.currentTime);
                    } else if (errQ.size > errQ.store.length) {
                        console.log("Node " + this.id + ":" + this.name + ":" + this.type + " at time " + this.currentTime + " inserting event " + e2.id + " in errQ: " + errQ.name);
                        errQ.put(e2, this.currentTime);
                    }
                    return 1;
                } else {
                    if (1 == 0) console.log("Node " + this.id + ":" + this.name + ":" + this.type + " at time " + this.currentTime + " has nothing in input Q");
                    /* try to jump clock to next element in Q */
                    if (inQ.store.length > 0 && 1 == 0) {
                        this.waitTime += inQ.store[0].availableTimeQ - this.currentTime;
                        this.currentTime = inQ.store[0].availableTimeQ;
                    }
                    /* Test ended */
                    else {
                        this.currentTime += this.skipTime;
                        this.waitTime += this.skipTime;
                    }
                    return 0;
                };
            case 'IL'://Ib Lift - read from ILq and send to LSq

                // Peek element in inQ, if mask and space in outQ, send to outQ, if space in outQ send to errQ, else leave

                inQ = getQ(this.inQArray[0]); // Only first element is important
                errQ = this.errQ;
                if ((e1 = inQ.peek(this.currentTime)) != null) { // There is something to be processed 
                    level = e1.location.level;
                    index = this.getIndexFromLevel(level, outQArray);
                    if (index == -1) // Invalid level
                        outQ = errQ;
                    else
                        outQ = getQ(this.outQArray[index]);
                    //outQ = this.outQArray[level - 1];
                    //if ((outQ.size == outQ.store.length) && (errQ.size == errQ.store.length)) { // Output Queues are full, we are blocked
                    if ((outQ.size == outQ.store.length) && (errQ.size = errQ.store.length)) {
                        console.log("Node " + this.id + ":" + this.name + ":" + this.type + " at time " + this.currentTime + " found no space in outQ or ErrQ, will wait");
                        this.blockTime += this.skipTime; // e1.currentTime - this.currentTime; // Need to think over this..
                        if (1 == 0) console.log("Check logic ofr node.process for Lift.. Wait times");
                        this.currentTime += this.skipTime;
                        return 0;
                    }
                    e2 = inQ.get(this.currentTime);
                    this.currentTime += this.processTime;
                    if ((outQ.size > outQ.store.length) && (checkMask(e2.location, this.mask))) {
                        console.log("Node " + this.id + ":" + this.name + ":" + this.type + " at time " + this.currentTime + " inserting event " + e2.id + " in outQ: " + outQ.name);
                        outQ.put(e2, this.currentTime);
                    } else if (errQ.size > errQ.store.length) {
                        console.log("Node " + this.id + ":" + this.name + ":" + this.type + " at time " + this.currentTime + " inserting event " + e2.id + " in errQ: " + errQ.name);
                        errQ.put(e2, this.currentTime);
                    }
                    return 1;
                } else {
                    if (1 == 0) console.log("Node " + this.id + ":" + this.name + ":" + this.type + " at time " + this.currentTime + " has nothing in input Q");
                    if (inQ.store.length > 0 && 1 == 0) {
                        this.waitTime += inQ.store[0].availableTimeQ - this.currentTime;
                        this.currentTime = inQ.store[0].availableTimeQ;
                    }
                    /* Test ended */
                    else {
                        this.currentTime += this.skipTime;
                        this.waitTime += this.skipTime;
                    }
                    return 0;
                };
            case 'S'://Shuttle - read from ILq, put in storage, read from Stq, put in LOq
                // Shuttle will read from ElementQ and ShuttleTask Q. If FIFO mode, it will do FIFO. If dual cycle mode, it will do one from each.
                // 20160720 - It is assumed that ASRS storage is accessible to all shuttles (we may need to change this assumption later 
                // Peek element in inQ, if mask and space in outQ, send to outQ, if space in outQ send to errQ, else leave
                this.errQ = this.errQ; //For typical Shuttle, this will be same as outQ
                this.inQ = getQ(this.inQArray[0]); // elementQ
                this.tQ = getQ(this.inQArray[1]); // Task Queue
                this.asrs = getQ('ASRS'); // This gets us store for ASRS. Each member of this array is a Slot element
                this.outQ = getQ(this.outQArray[0]);
                this.jump = 0;
                for (this.i = 0; this.i < this.inQArray.length; this.i++) {
                    this.last = (this.i + this.last) % this.inQArray.length;
                    this.inQ = getQ(this.inQArray[this.last]);
                    if ((e1 = this.inQ.peek(this.currentTime)) != null) { //This Q has something
                        // if Q is Element, check if storage is empty, else if Task, (check if storage has element, and outQ is free), else block
                        if ((this.inQ.type == 'Q') && (this.asrs.store[e1.Position.aisle][e1.Position.level][e1.Position.index].content == null)) {
                            console.log("Storing in ASRS");
                            e2 = this.inQ.get(this.currentTime); // Remove element from Q
                            this.asrs.put(e2, this.currentTime, e2.location);
                            // Increment shuttle time 
                            this.currentTime += this.processTime;
                            e2 = null;
                            return 1;
                        } else if ((this.inQ.type == 'T') && (this.asrs.store[e1.Position.aisle][e1.Position.level][e1.Position.index].content != null) && (this.outQ.store.length < this.outQ.size)) {
                            console.log("Taking out from ASRS");
                            e2 = this.inQ.get(this.currentTime); // remove element from task Q
                            e3 = this.asrs.get(this.currentTime, e2.location); // Remove element from Q
                            this.outQ.put(e3, this.currentTime, new Location(99,99,99));
                            // Increment shuttle time 
                            this.currentTime += this.processTime;
                            e2 = null;
                            e3 = null;
                            return 1;
                        } else {
                            console.log("Shuttle: Ignoring move:" + e1);
                            //this.currentTime += this.skipTime;
                            //this.blockTime += this.skipTime;
                            //return 0;
                        }
                    }
                }
                this.currentTime += this.skipTime;
                this.waitTime += this.skipTime;
                return 0;

            case 'OL'://outbound lift - read from LOq and put in AOq
                ;
            case 'A':// Angular Merge - 
            case 'T':// Right Angle Transfer Merge - 
                this.inQ = getQ(this.inQArray[0]); //This is primary line Q
                this.mQ = getQ(this.inQArray[1]); // Merge line Q
                this.outQ = getQ(this.outQArray[0]); // Task Queue
                if (this.outQ.store.length >= this.outQ.size) { // OutQ is full, we better retry later
                    this.currentTime += this.skipTime;
                    this.blockTime += this.skipTime;
                    return 0;
                }
                if ((e1 = this.inQ.peek(this.currentTime)) != null) { //Primary Q has something, it gets priority
                    // Check space on outQ, if space, move to outQ, adjust time
                
                    e1 = this.inQ.get(this.currentTime);
                    this.currentTime += this.processTime;
                    this.outQ.put(e1, this.currentTime);
                    console.log("Putting " + e1.barCode + " availableTime = " + e1.availableTimeQ + " from pQ at " + this.currentTime);
                    return 1;
                } else if (((e2 = this.mQ.peek(this.currentTime)) != null) &&
                    ((this.inQ.store.length == 0) || ((this.inQ.store.length > 0) && (this.inQ.store[0].availableTimeQ > e2.availableTimeQ + this.mergeWindow)))) { // Merge Q has something 
                    e2 = this.mQ.get(this.currentTime);
                    this.currentTime += this.mergeTime;
                    this.outQ.put(e2, this.currentTime);
                    console.log("Putting " + e2.barCode + " availableTime = " + e2.availableTimeQ + " from mQ at " + this.currentTime);

                    return 1;
                    ; // Merge Q has something and can be processed
                } else {
                    this.inQAdjust = this.inQ.queueDelay;
                    if (this.inQ.store.length > 0)
                        this.inQAdjust = this.inQ.store[0].availableTimeQ - this.currentTime;
                    this.mQAdjust = this.mQ.queueDelay;
                    if (this.mQ.store.length > 0)
                        this.mQAdjust = this.mQ.store[0].availableTimeQ - this.currentTime;
                    this.tAdjust = (this.mQAdjust + this.mergeWindow < this.inQAdjust) ? this.mQAdjust : this.inQAdjust;
                    if (this.tAdjust == 0) this.tAdjust = this.skipTime;
                    this.currentTime += this.tAdjust;
                    this.waitTime += this.adjustTime; // Merge Wait time may be misleading. 
                    console.log("New node time is " + this.currentTime);
                    return 0;
                };
                //return 0;
            default:
                ;
        }

        return -1; //indicates that no tote was processed
        //return 1; // indicates that a tote was processed
    }
}
Node.counter = 0;
//------ Helper functions 
function getQ(qname) {
    for (i1 = 0; i1 < qArray.length; i1++) {
        if (qArray[i1].name == qname)
            return qArray[i1];
    }
    return null;
}

// Reset for tests
function resetAll() {
    Node.counter = 0;
    Element.counter = 0;
    Queue.counter = 0;
    storage = new Array();
    qArray = [];
    nArray = [];
    eArray = [];
};

//------- Test Merge------------------
resetAll();
// Queues
qArray.push(new Queue('pQ', 'Q', 8));  // primary Q
qArray.push(new Queue('mQ', 'Q', 4));   // Merge Q
qArray.push(new Queue('oQ', 'Q', 12));  // Out Q
getQ('pQ').queueDelay = 0;
getQ('mQ').queueDelay = 0;
getQ('oQ').queueDelay = 0;
// Node
nArray.push(new Node('TM', 'T', 2, ['pQ', 'mQ'], ['oQ'], 'oQ', new Mask(2, null, null)));
nArray[0].mergeWindow = 3;
nArray[0].mergeTime = 2;
nArray[0].processTime = 1;

// Totes
eArray.push(new Element('0001', 'C', 1, new Position(1, 1, 1)));
eArray.push(new Element('0002', 'C', 4, new Position(1, 2, 2)));
eArray.push(new Element('0003', 'C', 8, new Position(2, 1, 3)));
eArray.push(new Element('0004', 'C', 11, new Position(1, 3, 4)));
eArray.push(new Element('0005', 'C', 15, new Position(3, 1, 5)));
eArray.push(new Element('0006', 'C', 24, new Position(2, 1, 6)));
eArray.push(new Element('0007', 'C', 1, new Position(1, 1, 6)));
eArray.push(new Element('0008', 'C', 2, new Position(1, 2, 6)));
eArray.push(new Element('0009', 'C', 6, new Position(3, 1, 6)));
eArray.push(new Element('0010', 'C', 10, new Position(2, 1, 6)))
// Put tote in pQ
for (i2 = 0; i2 < 6; i2++) {
    getQ('pQ').put(eArray[i2], eArray[i2].createTime);
}
// Put tote in mQ
for (i2 = 6; i2 < eArray.length; i2++) {
    getQ('mQ').put(eArray[i2], eArray[i2].createTime);
}


currentTime = 0;
while (currentTime < 100) {
    var i3 = 0;
    currentNode = nArray[0];
    for (i3 = 0; i3 < nArray.length; i3++) {
        if (currentNode.currentTime > nArray[i3].currentTime)
            currentNode = nArray[i3];
    }
    currentNode.process();
    currentTime = currentNode.currentTime;
}


//*********** Test Data
// Test mask --------
pos1 = new Position(1, 1, 1);
mask = new Mask(1, null, null);
console.log(new Date() + ": Result of check mask is " + checkMask(pos1, mask));


// Storage setup
nAisle = 5;
nLevel = 3;
nSlot = 20;

for (i = 0; i < nAisle; i++) {
    aisle = new Array();
    for (j = 0; j < nLevel; j++) {
        level = new Array();
        for (k = 0; k < nSlot; k++) {
            level.push(new Slot());
        }
        aisle.push(level);
    }
    storage.push(aisle);
}




console.log("Defining 3 queues");
/* insert Storage */
qArray.push(new Queue('ASRS', 'S', 10));

qArray.push(new Queue('D1iQ', 'Q', 10));
qArray.push(new Queue('A1iQ', 'Q', 5));
qArray.push(new Queue('A1L1iQ', 'Q', 3));
qArray.push(new Queue('A1L2iQ', 'Q', 3));
qArray.push(new Queue('A1L3iQ', 'Q', 3));

qArray.push(new Queue('D2iQ', 'Q', 3));
qArray.push(new Queue('A2iQ', 'Q', 5));
qArray.push(new Queue('D3iQ', 'Q', 12));
qArray.push(new Queue('A3iQ', 'Q', 5));
qArray.push(new Queue('D4iQ', 'Q', 7));

qArray.push(new Queue('A1L1tQ', 'T', 100)); // Task Queue for A1L1
qArray.push(new Queue('A1L1oQ', 'Q', 3)); // Outbound Queue for A1L1



getQ('D1iQ').queueDelay = 6;
getQ('A1iQ').queueDelay = 2;
getQ('A1L1iQ').queueDelay = 4;
getQ('A1L2iQ').queueDelay = 2;
getQ('A1L3iQ').queueDelay = 1;
getQ('D2iQ').queueDelay = 2;
getQ('A2iQ').queueDelay = 2;

nArray.push(new Node('Divert1', 'D', 1, ['D1iQ'], ['A1iQ'], 'D2iQ', new Mask(1, null, null)));
nArray.push(new Node('IL1', 'IL', 2, ['A1iQ'], ['A1L1iQ', 'A1L2iQ', 'A1L3iQ'], 'A1L1iQ', new Mask(1, null, null)));
//nArray.push(new Node('A1L1S', 'S', 3, ['A1L1iQ','A1L1tQ'], ['A1L1oQ'], 'A1L1oQ', new Mask(1, null, null)));
nArray.push(new Node('Divert2', 'D', 2, ['D2iQ'], ['A2iQ'], 'D3iQ', new Mask(2, null, null)));
nArray.push(new Node('Divert3', 'D', 3, ['D3iQ'], ['A3iQ'], 'D4iQ', new Mask(3, null, null)));
nArray[1].processTime = 5; // Now Divert 2 is quite slow. D2iQ should get filled

console.log("Defining Totes");

eArray.push(new Element('0001', 'C', 1, new Position(1, 1, 1)));
eArray.push(new Element('0002', 'C', 4, new Position(1, 2, 2)));
eArray.push(new Element('0003', 'C', 6, new Position(2, 1, 3)));
eArray.push(new Element('0004', 'C', 7, new Position(1, 3, 4)));
eArray.push(new Element('0005', 'C', 8, new Position(3, 1, 5)));
eArray.push(new Element('0006', 'C', 11, new Position(2, 1, 6)));
eArray.push(new Element('0007', 'C', 18, new Position(1, 1, 6)));
eArray.push(new Element('0008', 'C', 19, new Position(1, 2, 6)));
eArray.push(new Element('0009', 'C', 22, new Position(3, 1, 6)));
eArray.push(new Element('0010', 'C', 30, new Position(2, 1, 6)));

//--------------- insert in Q[0] ------------------------------------------
for (i2 = 0; i2 < eArray.length; i2++) {
    getQ('D1iQ').put(eArray[i2], eArray[i2].createTime);
}

t1e1 = eArray[0];
t1sQ = qArray[0];
t1sQ.store[1][1][1];
t1sQ.put(t1e1, 5, t1e1.location);
t1sQ.store[1][1][1];
t1sQ.get(10, new Position(1, 1, 1));




currentTime = 0;
while (currentTime < 100) {
    var i3 = 0;
    currentNode = nArray[0];
    for (i3 = 0; i3 < nArray.length; i3++) {
        if (currentNode.currentTime > nArray[i3].currentTime)
            currentNode = nArray[i3];
    }
    currentNode.process();
    currentTime = currentNode.currentTime;
}

//console.log("Defining 1 node");
//nD1 = new Node(1, 'Divert1', 'D', 1, [qD1iQ], [qL1iQ], qD2iQ, mask);

for (i4 = 0; i4 < eArray.length; i4++) {
    e = eArray[i4];
    console.log("Element:" + i + ",Create Time:" + e.createTime + ",InsertTime:" + e.insertTimeQ + ",AvailableTime" + e.availableTimeQ + ",WaitTime:" + e.waitTime + ",Q:" + e.currentQ.name);
}
for (i5 = 0; i5 < nArray.length; i5++) {
    n = nArray[i5];
    console.log("Node:" + n.name + ",CurrentTime:" + n.currentTime + ",BlockTime:" + n.blockTime + ",WaitTime:" + n.waitTime);
}





