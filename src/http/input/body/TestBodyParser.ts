import { getLoggerFor } from '../../../logging/LogUtil';
import { BadRequestHttpError } from '../../../util/errors/BadRequestHttpError';
import { BasicRepresentation } from '../../representation/BasicRepresentation';
import type { Representation } from '../../representation/Representation';
import type { BodyParserArgs } from './BodyParser';
import { BodyParser } from './BodyParser';


const fs = require('fs');
const path = require('path');
const parser = require('rocketrml');

const folderPath = path.join(__dirname, '../../../../test_folder');

const doMapping = async (inputFiles: any) => {
  const options = {
    toRDF: true,
    verbose: true,
    xmlPerformanceMode: false,
    replace: false,
  };

  const mappingPath = path.join(folderPath, "mappings.ttl")
  
  const resultPath = path.join(folderPath, "out.n3")



  fs.readFile(mappingPath, 'utf8', async (err: any, data: any) => {
    if (err) {
        console.error('Error reading the file', err);
        return;
    }
    let mapfile: any;
    mapfile = data;

    
  console.log(mapfile)

  const result = await parser.parseFileLive(mapfile, inputFiles, options);


  // Save JSON string to file
/*
    fs.writeFile(resultPath, result, (err: any) => {
    if (err) {
      console.error('Error writing file', err);
    } else {
      console.log('Successfully wrote file');
    }
  });
  */
//  const result = await parser.parseFile(mappingPath, resultPath, options).catch((err: any) => { console.log(err); });
  console.log(result);
  });
};

/**
 * Converts incoming {@link HttpRequest} to a Representation without any further parsing.
 */
export class TestBodyParser extends BodyParser {
  protected readonly logger = getLoggerFor(this);

  // Note that the only reason this is a union is in case the body is empty.
  // If this check gets moved away from the BodyParsers this union could be removed
  public async handle({ request, metadata }: BodyParserArgs): Promise<Representation> {
    const {
      'content-type': contentType,
      'content-length': contentLength,
      'transfer-encoding': transferEncoding,
    } = request.headers;


    console.log("Hello world");
    
    // Define the path where you want to save the file
    // path.join ensures the path is correct regardless of the OS
    
 
    // RFC7230, §3.3: The presence of a message body in a request
    // is signaled by a Content-Length or Transfer-Encoding header field.
    // While clients SHOULD NOT use use a Content-Length header on GET,
    // some still provide a Content-Length of 0 (but without Content-Type).
    if ((!contentLength || (/^0+$/u.test(contentLength) && !contentType)) && !transferEncoding) {
      this.logger.debug('HTTP request does not have a body, or its empty body is missing a Content-Type header');
      return new BasicRepresentation([], metadata);
    }




    // While RFC7231 allows treating a body without content type as an octet stream,
    // such an omission likely signals a mistake, so force clients to make this explicit.
    if (!contentType) {

      this.logger.warn('HTTP request has a body, but no Content-Type header');
      throw new BadRequestHttpError('HTTP request body was passed without a Content-Type header');
    }


    // While RFC7231 allows treating a body without content type as an octet stream,
    // such an omission likely signals a mistake, so force clients to make this explicit.
    if (contentType == "application/json") {

  
       
    // Some testdata
    const data = {
      name: "John Doe",
      age: 30,
      city: "New York"
    };
    
    if (request.url == '/test_folder') {
        // Convert JavaScript object to JSON string
        const jsonString = JSON.stringify(data, null, 2); // The "2" here formats the JSON string with 2-space indentation

        

        let inputFiles = {'mydata': jsonString}
     
      
      doMapping(inputFiles)
    }
   }
    return new BasicRepresentation(request, metadata);
  }
}
