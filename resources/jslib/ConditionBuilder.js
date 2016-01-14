var ConditionBuilder = {
    

    // **** baseUrl - Gisclient service URL
    baseUrl : '/gisclient',
    
    rootCondition: '<table>'+
            '<tr><td class="seperator" ><img src="../resources/themes/icons/remove.png" alt="Remove" class="remove" /><select><option value="and">And</option><option value="or">Or</option></select></td>' +
            '<td><div class="querystmts"></div><div><img class="add" src="../resources/themes/icons/add.png" alt="Add" /> <button class="addroot">+()</button></div>' +
            '</td></tr></table>',
    
    operators: {
        equalto: {
            operator: '=',
            label: 'Uguale'
        },
        notequalto: {
            operator: '!=',
            label: 'Diverso'
        },
        contains: {
            operator: 'ILIKE',
            label: 'Contiene',
            wildchar: 'both'
        },
        startswith: {
            operator: 'ILIKE',
            label: 'Inizia con',
            wildchar: 'right'
        },
        endswith: {
            operator: 'ILIKE',
            label: 'Finisce con',
            wildchar: 'left'
        },
        isnull: {
            operator: 'is null',
            label: 'E\' nullo',
            noValue: true
        },
        isnotnull: {
            operator: 'is not null',
            label: 'Non è nullo',
            noValue: true
        },
        lessthan: {
            operator: '<',
            label: 'Minore'
        },
        greaterthan: {
            operator: '>',
            label: 'Maggiore'
        }
    },
    
    iterations: 0,
    placeHolderCount: 0,
    
    featureType: undefined,
    rootSelector: undefined,
    
    init: function(selector) {
        this.rootSelector = selector;        
    },
    
    addQueryRoot: function(selector, isRoot) {
        var self = this;
        
        $(selector).append(self.rootCondition);
        var q = $(selector).find('table');
        var l = q.length;
        var elem = q;
        if (l > 1) {
            elem = $(q[l - 1]);
        }

        //If root element remove the close image
        if (isRoot) {
            elem.find('td >.remove').detach();
        }
        else {
            elem.find('td >.remove').click(function () {
                // td>tr>tbody>table
                $(this).parent().parent().parent().parent().detach();
            });
        }
        
        if(self.featureType) {
            var statement = self.getConditionStatement();

            // Add the default staement segment to the root condition
            elem.find('td >.querystmts').append(statement);

            // Add the head class to the first statement
            elem.find('td >.querystmts div >.remove').addClass('head');

            // Handle click for adding new statement segment
            // When a new statement is added add a condition to handle remove click.
            elem.find('td div >.add').click(function () {
                $(this).parent().siblings('.querystmts').append(statement);
                var stmts = $(this).parent().siblings('.querystmts').find('div >.remove').filter(':not(.head)');
                stmts.unbind('click');
                stmts.click(function () {
                    $(this).parent().detach();
                });
            });

            // Handle click to add new root condition
            elem.find('td div > .addroot').click(function () {
                self.addQueryRoot($(this).parent(), false);
            });
            
            $(this.rootSelector + ' select[useSuggest="1"]').change(function() {
                var selected = $('option:selected', this),
                    fieldId = $(selected).attr('fieldId'),
                    input = $(this).nextAll('input');

                if($(selected).attr('useSuggest') == 1) {
                    $(input).typeahead({
                        minLength: 2
                    },{
                        source: function(query, process) {
                            return $.ajax({
                                url: self.baseUrl + '/services/xSuggest.php',
                                data: {
                                    suggest: query,
                                    field_id: fieldId
                                },
                                dataType: 'json',
                                success: function(data) {
                                    return process(data.data);
                                }
                            });
                        }
                    });
                } else console.log('no input');
            });
        } else console.log('no feature type');
    },
    
    getConditionStatement: function() {
        var len = this.featureType.properties.length, i, field,
            options = [], fieldOption,
            operator, statement, suggest;

        statement = '<div class="form-control" cbcontainer="yes"><img src="../resources/themes/icons/remove.png" alt="Remove" class="remove" />'

        suggest = false;
        for(i = 0; i < len; i++) {
            field = this.featureType.properties[i];
            
            if(!field.searchType) continue;
            
            fieldOption = '<option value="'+field.name+'"';
            
            if(field.searchType == 3) {
                suggest = true;
                fieldOption += ' useSuggest="1" fieldId="'+field.fieldId+'"';
            }
            fieldOption += '>'+field.header+'</option>';
            
            options.push(fieldOption);
        }
        statement += '<select class="col"';
        if(suggest) statement += ' useSuggest="1"';
        statement += '>'+options.join(' ')+'</select>';

        statement += '<select class="op">';
        for(i in this.operators) {
            if(this.operators.hasOwnProperty(i)) {
                operator = this.operators[i];
                statement += '<option value="'+i+'">'+operator.label+'</option>';
            }
        }

        statement += '</select>';

        statement += '<input type="text" /></div>';

        return statement;
    },
    
    reset: function() {
        $(this.rootSelector).empty();
    },
    
    setFeatureType: function(featureType) {
        this.featureType = featureType;
        this.reset();
        this.addQueryRoot(this.rootSelector, true);
    },
    
    getCondition: function(selector) {
        this.iterations++;
        if(this.iterations > 10) return console.log('troppe iterations...');
        
        var rootSelector = selector || $(this.rootSelector).children();
        //Get the columns from table (to find a clean way to do it later) //tbody>tr>td
        var elem = $(rootSelector).children().children().children();
        //elem 0 is for operator, elem 1 is for expressions

        var q = {};
        var expressions = [];
        var nestedexpressions = [];

        var operator = $(elem[0]).find(':selected').val();
        q.operator = operator;

        // Get all the expressions in a condition
        var expressionelem = $(elem[1]).find('> .querystmts div[cbcontainer="yes"]');
        for (var i = 0; i < expressionelem.length; i++) {
            expressions[i] = {};
            var col = $(expressionelem[i]).find('.col :selected');
            var op = $(expressionelem[i]).find('.op :selected');
            expressions[i].colval = col.val();
            expressions[i].coldisp = col.text();
            expressions[i].opval = op.val();
            expressions[i].opdisp = op.text();
            expressions[i].val = $(expressionelem[i]).find('input:not(.tt-hint)').val();
        }
        q.expressions = expressions;

        // Get all the nested expressions
        var childTables = $(elem[1]).find('table');
        if (childTables.length != 0) {
            var len = $(elem[1]).find('table').length;

            for (var k = 0; k < len; k++) {
                nestedexpressions[k] = this.getCondition($(elem[1]).find('table')[k]);
            }
        }
        q.nestedexpressions = nestedexpressions;

        return q;
    },
    
    getQuery: function(rootCondition) {
        var condition = rootCondition || this.getCondition();
        var op = [' ', condition.operator, ' '].join('');
        var values = {};

        //la costruzione della query è ben più complicata di così...
        var e = [];
        var elen = condition.expressions.length;
        for (var i = 0; i < elen; i++) {
            var expr = condition.expressions[i];
            var operator = this.operators[expr.opval].operator;
            var placeholder = ':param_' + this.placeHolderCount;
            var value = expr.val;
            if(this.operators[expr.opval].wildchar) {
                switch(this.operators[expr.opval].wildchar) {
                    case 'both':
                        value = '%'+value+'%';
                    break;
                    case 'left':
                        value = '%'+value;
                    break;
                    case 'right':
                        value = value+'%';
                    break;
                }
            }
            if(this.operators[expr.opval].noValue) {
                value = '';
                placeholder = '';
            } else {
                values['param_' +  this.placeHolderCount] = value;
                this.placeHolderCount++;
            }
            e.push(expr.colval + ' ' + operator + ' ' + placeholder);
        }

        var n = [];
        var nlen = condition.nestedexpressions.length;
        for (var k = 0; k < nlen; k++) {
            var nestexpr = condition.nestedexpressions[k];
            var result = this.getQuery(nestexpr);
            n.push(result.query);
            $.extend(values, result.values);
        }

        var q = [];
        if (e.length > 0)
            q.push(e.join(op));
        if (n.length > 0)
            q.push(n.join(op));

        return {
            query: ['(', q.join(op), ')'].join(' '), 
            values: values
        };
    }
};